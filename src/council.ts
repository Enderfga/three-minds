/**
 * Three Minds v2.1 - 核心协作引擎
 * 
 * 统一使用 claude-code-skill 调用所有模型
 * 无论 Claude/GPT/Gemini，都走同一套 agent 框架
 */

import { v4 as uuidv4 } from 'uuid';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  CouncilConfig,
  CouncilSession,
  AgentResponse,
  AgentPersona,
} from './types';

// 默认超时时间
const DEFAULT_TIMEOUT_MS = 300000;  // 5 分钟
const MIN_TASK_LENGTH = 5;  // 最小任务描述长度

/**
 * 通过 claude-code-skill 执行任务
 * 
 * 统一入口：所有模型都通过 claude-code-skill 调用
 */
function runViaClaudeCodeSkill(
  prompt: string,
  systemPrompt: string,
  workDir: string,
  options: {
    model?: string;
    baseUrl?: string;
    timeoutMs?: number;
  } = {}
): string {
  const { model, baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  
  // 生成唯一 session 名称
  const sessionName = `three-minds-${Date.now()}`;
  
  // 1. 启动 session
  const startArgs = [
    'session-start', sessionName,
    '-d', workDir,
    '--permission-mode', 'acceptEdits',
    '--append-system-prompt', systemPrompt,
  ];
  
  if (model) {
    startArgs.push('--model', model);
  }
  if (baseUrl) {
    startArgs.push('--base-url', baseUrl);
  }

  const startResult = spawnSync('claude-code-skill', startArgs, {
    encoding: 'utf-8',
    timeout: 30000,  // 30s 启动超时
  });

  if (startResult.error) {
    throw new Error(`Failed to start session: ${startResult.error.message}`);
  }
  
  // 检查启动是否成功
  if (startResult.stderr && startResult.stderr.includes('error')) {
    throw new Error(`Session start failed: ${startResult.stderr}`);
  }

  try {
    // 2. 发送任务
    const sendArgs = [
      'session-send', sessionName, prompt,
      '-t', String(timeoutMs),
    ];

    const sendResult = spawnSync('claude-code-skill', sendArgs, {
      cwd: workDir,
      encoding: 'utf-8',
      timeout: timeoutMs + 10000,  // 额外 10s buffer
      maxBuffer: 50 * 1024 * 1024,
    });

    if (sendResult.error) {
      throw sendResult.error;
    }

    return (sendResult.stdout as string) || '';
  } finally {
    // 3. 清理 session
    spawnSync('claude-code-skill', ['session-stop', sessionName], {
      encoding: 'utf-8',
      timeout: 10000,
    });
  }
}

/**
 * 解析共识投票
 */
function parseConsensus(content: string): boolean {
  const match = content.match(/\[CONSENSUS:\s*(YES|NO)\]/i);
  if (match) {
    return match[1].toUpperCase() === 'YES';
  }
  return false;
}

/**
 * 构建 agent 任务 prompt
 */
function buildAgentPrompt(
  agent: AgentPersona,
  task: string,
  round: number,
  previousResponses: AgentResponse[],
  allAgents: AgentPersona[]
): string {
  const otherAgents = allAgents.filter(a => a.name !== agent.name);
  
  // 构建之前的讨论历史
  let history = '';
  if (previousResponses.length > 0) {
    history = '\n\n## 之前的协作记录\n\n';
    let currentRound = 0;
    for (const resp of previousResponses) {
      if (resp.round !== currentRound) {
        currentRound = resp.round;
        history += `### 第 ${currentRound} 轮\n\n`;
      }
      const cleanContent = resp.content.replace(/\[CONSENSUS:\s*(YES|NO)\]/gi, '').trim();
      const preview = cleanContent.length > 800 ? cleanContent.slice(0, 800) + '...' : cleanContent;
      history += `**${resp.agent}** (${resp.consensus ? '✅同意结束' : '❌继续'}):\n${preview}\n\n`;
    }
  }

  return `# 第 ${round} 轮协作

## 任务
${task}

## 你的伙伴
${otherAgents.map(a => `- ${a.emoji} ${a.name}`).join('\n')}
${history}
## 你的工作

请：
1. **查看当前状态** - 读取相关文件，了解当前代码/项目状态
2. **执行必要操作** - 根据你的专长，编写代码、修改文件、运行测试等
3. **审核他人工作** - 如果其他成员已有产出，审核并提出建议或直接改进
4. **汇报成果** - 简要说明你做了什么

## 共识投票

在回复**末尾**，必须投票（二选一）：

- \`[CONSENSUS: YES]\` - 任务完成，质量达标，可以结束
- \`[CONSENSUS: NO]\` - 还有工作要做或问题要解决

只有**所有三人都投 YES** 时协作才会结束。

开始工作吧！`;
}

/**
 * 构建 agent 的 system prompt
 */
function buildSystemPrompt(agent: AgentPersona, allAgents: AgentPersona[]): string {
  return `# 你的身份

你是 ${agent.emoji} **${agent.name}**。

${agent.persona}

# 协作规则

- 你是三人协作小组的一员
- 你可以自由读取、创建、修改工作目录中的文件
- 你可以执行代码、运行测试
- 审核他人工作时，可以直接修改文件来改进
- 保持简洁高效，避免冗长解释
- 每次回复末尾必须投票 [CONSENSUS: YES] 或 [CONSENSUS: NO]`;
}

/**
 * Three Minds 协作引擎
 */
export class Council {
  private config: CouncilConfig;
  private quiet: boolean;
  private timeoutMs: number;

  constructor(config: CouncilConfig, quiet: boolean = false) {
    this.config = config;
    this.quiet = quiet;
    this.timeoutMs = (config as any).timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  async run(task: string): Promise<CouncilSession> {
    if (!task || typeof task !== 'string') {
      throw new Error('Task must be a non-empty string');
    }
    const trimmedTask = task.trim();
    if (trimmedTask.length < MIN_TASK_LENGTH) {
      throw new Error(`Task description too short (min ${MIN_TASK_LENGTH} chars)`);
    }
    
    const session: CouncilSession = {
      id: uuidv4(),
      task: trimmedTask,
      config: this.config,
      responses: [],
      status: 'running',
      startTime: new Date().toISOString(),
    };

    this.log(`\n🧠 Three Minds v2.1 - 统一 Agent 框架\n`);
    this.log(`📋 任务: ${task}`);
    this.log(`📁 工作目录: ${this.config.projectDir}`);
    this.log(`👥 参与者: ${this.config.agents.map(a => `${a.emoji} ${a.name}`).join(', ')}`);
    this.log(`⏱️  最大轮数: ${this.config.maxRounds}`);
    this.log(`🔌 统一通过 claude-code-skill 调用`);
    this.log(`${'━'.repeat(60)}\n`);

    try {
      for (let round = 1; round <= this.config.maxRounds; round++) {
        this.log(`\n🔄 第 ${round} 轮\n`);

        const roundVotes: boolean[] = [];

        for (const agent of this.config.agents) {
          const modelInfo = agent.model ? ` [${agent.model}]` : ' [default]';
          const proxyInfo = agent.baseUrl ? ` via ${agent.baseUrl}` : '';
          this.log(`${agent.emoji} ${agent.name}${modelInfo}${proxyInfo} 开始工作...`);

          const prompt = buildAgentPrompt(agent, trimmedTask, round, session.responses, this.config.agents);
          const systemPrompt = buildSystemPrompt(agent, this.config.agents);

          try {
            const content = runViaClaudeCodeSkill(prompt, systemPrompt, this.config.projectDir, {
              model: agent.model,
              baseUrl: agent.baseUrl,
              timeoutMs: this.timeoutMs,
            });

            const consensus = parseConsensus(content);
            roundVotes.push(consensus);

            session.responses.push({
              agent: agent.name,
              round,
              content,
              consensus,
              sessionKey: `claude-code-skill-${agent.name}-r${round}`,
              timestamp: new Date().toISOString(),
            });

            const lines = content.split('\n').filter(l => l.trim());
            const preview = lines.slice(0, 3).join(' ').slice(0, 150);
            this.log(`  ✅ 完成 | 共识: ${consensus ? 'YES ✓' : 'NO ✗'}`);
            this.log(`  📝 ${preview}...`);
          } catch (error: any) {
            this.log(`  ❌ 错误: ${error.message}`);
            roundVotes.push(false);
            session.responses.push({
              agent: agent.name,
              round,
              content: `Error: ${error.message}`,
              consensus: false,
              sessionKey: '',
              timestamp: new Date().toISOString(),
            });
          }
          this.log('');
        }

        const allYes = roundVotes.length === this.config.agents.length && roundVotes.every(v => v);
        
        if (allYes) {
          this.log(`\n✅ 共识达成！(第 ${round} 轮)\n`);
          session.status = 'consensus';
          break;
        } else {
          const yesCount = roundVotes.filter(v => v).length;
          this.log(`📊 本轮投票: ${yesCount}/${this.config.agents.length} YES\n`);
        }
      }

      if (session.status === 'running') {
        session.status = 'max_rounds';
        this.log(`\n⚠️ 达到最大轮数 (${this.config.maxRounds})，结束协作\n`);
      }

      session.endTime = new Date().toISOString();
      session.finalSummary = this.generateSummary(session);
      this.log(`\n${'━'.repeat(60)}`);
      this.log(`\n${session.finalSummary}`);
      this.saveTranscript(session);

      return session;
    } catch (error: any) {
      session.status = 'error';
      session.endTime = new Date().toISOString();
      this.log(`\n❌ 错误: ${error.message}`);
      throw error;
    }
  }

  private log(message: string) {
    if (!this.quiet) console.log(message);
  }

  private generateSummary(session: CouncilSession): string {
    const lines: string[] = [];
    lines.push(`# 📋 协作总结\n`);
    lines.push(`- **任务**: ${session.task}`);
    lines.push(`- **状态**: ${session.status === 'consensus' ? '✅ 达成共识' : '⚠️ 达到最大轮数'}`);
    const maxRound = session.responses.length > 0 ? Math.max(...session.responses.map(r => r.round)) : 0;
    lines.push(`- **总轮数**: ${maxRound}`);
    lines.push(`- **工作目录**: ${session.config.projectDir}\n`);
    lines.push(`## 各成员最终状态\n`);
    const lastResponses = session.responses.filter(r => r.round === maxRound);
    for (const resp of lastResponses) {
      const agent = session.config.agents.find(a => a.name === resp.agent);
      const emoji = agent?.emoji || '🤖';
      lines.push(`### ${emoji} ${resp.agent}`);
      lines.push(`- **共识投票**: ${resp.consensus ? '✅ YES' : '❌ NO'}`);
      const cleanContent = resp.content.replace(/\[CONSENSUS:\s*(YES|NO)\]/gi, '').trim();
      const preview = cleanContent.slice(0, 400) + (cleanContent.length > 400 ? '...' : '');
      lines.push(`- **最后发言**:\n${preview}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private saveTranscript(session: CouncilSession) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `three-minds-${timestamp}.md`;
    const filepath = path.join(this.config.projectDir, filename);
    let content = `# Three Minds 协作记录\n\n`;
    content += `- **时间**: ${session.startTime}\n`;
    content += `- **任务**: ${session.task}\n`;
    content += `- **状态**: ${session.status}\n\n---\n\n`;
    let currentRound = 0;
    for (const resp of session.responses) {
      if (resp.round !== currentRound) {
        currentRound = resp.round;
        content += `## 第 ${currentRound} 轮\n\n`;
      }
      const agent = session.config.agents.find(a => a.name === resp.agent);
      const emoji = agent?.emoji || '🤖';
      content += `### ${emoji} ${resp.agent}\n\n`;
      content += resp.content + '\n\n';
    }
    content += `---\n\n`;
    content += session.finalSummary || '';
    fs.writeFileSync(filepath, content);
    this.log(`💾 协作记录已保存: ${filepath}`);
  }
}

export async function loadConfig(configPath: string): Promise<CouncilConfig> {
  const configDir = path.join(__dirname, '..', 'configs');
  if (!configPath.includes('/') && !configPath.endsWith('.json')) {
    const builtinPath = path.join(configDir, `${configPath}.json`);
    try {
      const content = fs.readFileSync(builtinPath, 'utf-8');
      return JSON.parse(content);
    } catch { /* continue */ }
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

export function getDefaultConfig(projectDir: string): CouncilConfig {
  return {
    name: '代码协作三人组',
    agents: [
      { name: '架构师', emoji: '🏗️', persona: '你是一位系统架构师。\n你关注：代码结构、设计模式、可扩展性、长期维护性。' },
      { name: '工程师', emoji: '⚙️', persona: '你是一位实现工程师。\n你关注：代码质量、错误处理、边界情况、性能优化。' },
      { name: '审核员', emoji: '🔍', persona: '你是一位代码审核员。\n你关注：代码规范、潜在 bug、安全问题、文档完整性。' },
    ],
    maxRounds: 15,
    projectDir,
  };
}
