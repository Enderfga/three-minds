/**
 * Three Minds v2 - Core Collaboration Engine
 * 
 * Uses Claude Code CLI to spawn real working sub-agents
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

/**
 * Execute Claude Code CLI
 */
function runClaude(
  prompt: string,
  systemPrompt: string,
  workDir: string,
  timeoutMs: number = 300000
): string {
  const result = spawnSync('claude', [
    '--print',                          // Non-interactive mode
    '--output-format', 'text',          // Plain text output
    '--append-system-prompt', systemPrompt,
    '--dangerously-skip-permissions',   // Skip permission prompts (auto-accept)
    '--max-turns', '10',                // Max 10 tool call turns
    prompt,
  ], {
    cwd: workDir,
    encoding: 'utf-8',
    timeout: timeoutMs,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env },
  });

  if (result.error) {
    throw result.error;
  }
  
  return result.stdout || '';
}

/**
 * Parse consensus vote
 */
function parseConsensus(content: string): boolean {
  const match = content.match(/\[CONSENSUS:\s*(YES|NO)\]/i);
  if (match) {
    return match[1].toUpperCase() === 'YES';
  }
  return false;
}

/**
 * Build agent task prompt
 */
function buildAgentPrompt(
  agent: AgentPersona,
  task: string,
  round: number,
  previousResponses: AgentResponse[],
  allAgents: AgentPersona[]
): string {
  const otherAgents = allAgents.filter(a => a.name !== agent.name);
  
  // Build previous discussion history
  let history = '';
  if (previousResponses.length > 0) {
    history = '\n\n## Previous Collaboration Log\n\n';
    let currentRound = 0;
    for (const resp of previousResponses) {
      if (resp.round !== currentRound) {
        currentRound = resp.round;
        history += `### Round ${currentRound}\n\n`;
      }
      const cleanContent = resp.content.replace(/\[CONSENSUS:\s*(YES|NO)\]/gi, '').trim();
      // Keep only key info to avoid prompt getting too long
      const preview = cleanContent.length > 800 ? cleanContent.slice(0, 800) + '...' : cleanContent;
      history += `**${resp.agent}** (${resp.consensus ? '✅ Agreed to finish' : '❌ Continue'}):\n${preview}\n\n`;
    }
  }

  return `# Round ${round} Collaboration

## Task
${task}

## Your Partners
${otherAgents.map(a => `- ${a.emoji} ${a.name}`).join('\n')}
${history}
## Your Work

Please:
1. **Check current state** - Read relevant files, understand current code/project status
2. **Execute necessary actions** - Based on your expertise, write code, modify files, run tests, etc.
3. **Review others' work** - If other members have output, review and suggest improvements or improve directly
4. **Report results** - Briefly explain what you did

## Consensus Vote

At the **end** of your response, you must vote (choose one):

- \`[CONSENSUS: YES]\` - Task complete, quality acceptable, can finish
- \`[CONSENSUS: NO]\` - More work to do or issues to resolve

Collaboration only ends when **all three vote YES**.

Start working!`;
}

/**
 * Build agent system prompt
 */
function buildSystemPrompt(agent: AgentPersona, allAgents: AgentPersona[]): string {
  return `# Your Identity

You are ${agent.emoji} **${agent.name}**.

${agent.persona}

# Collaboration Rules

- You are a member of a three-person collaboration group
- You can freely read, create, and modify files in the working directory
- You can execute code and run tests
- When reviewing others' work, you can directly modify files to improve them
- Be concise and efficient, avoid lengthy explanations
- You must vote [CONSENSUS: YES] or [CONSENSUS: NO] at the end of each response`;
}

/**
 * Three Minds Collaboration Engine
 */
export class Council {
  private config: CouncilConfig;
  private quiet: boolean;

  constructor(config: CouncilConfig, quiet: boolean = false) {
    this.config = config;
    this.quiet = quiet;
  }

  /**
   * Start collaboration
   */
  async run(task: string): Promise<CouncilSession> {
    const session: CouncilSession = {
      id: uuidv4(),
      task,
      config: this.config,
      responses: [],
      status: 'running',
      startTime: new Date().toISOString(),
    };

    this.log(`\n🧠 Three Minds v2 - Multi-Agent Collaboration System\n`);
    this.log(`📋 Task: ${task}`);
    this.log(`📁 Working Directory: ${this.config.projectDir}`);
    this.log(`👥 Participants: ${this.config.agents.map(a => `${a.emoji} ${a.name}`).join(', ')}`);
    this.log(`⏱️  Max Rounds: ${this.config.maxRounds}`);
    this.log(`${'━'.repeat(60)}\n`);

    try {
      for (let round = 1; round <= this.config.maxRounds; round++) {
        this.log(`\n🔄 Round ${round}\n`);

        const roundVotes: boolean[] = [];

        // Let each agent work in sequence
        for (const agent of this.config.agents) {
          this.log(`${agent.emoji} ${agent.name} working...`);

          // Build prompt
          const prompt = buildAgentPrompt(
            agent,
            task,
            round,
            session.responses,
            this.config.agents
          );
          const systemPrompt = buildSystemPrompt(agent, this.config.agents);

          try {
            // Call Claude Code
            const content = runClaude(
              prompt,
              systemPrompt,
              this.config.projectDir,
              300000 // 5 minute timeout
            );

            const consensus = parseConsensus(content);
            roundVotes.push(consensus);

            const response: AgentResponse = {
              agent: agent.name,
              round,
              content,
              consensus,
              sessionKey: `claude-${agent.name}-r${round}`,
              timestamp: new Date().toISOString(),
            };
            session.responses.push(response);

            // Print summary
            const lines = content.split('\n').filter(l => l.trim());
            const preview = lines.slice(0, 3).join(' ').slice(0, 150);
            this.log(`  ✅ Done | Consensus: ${consensus ? 'YES ✓' : 'NO ✗'}`);
            this.log(`  📝 ${preview}...`);
          } catch (error: any) {
            this.log(`  ❌ Error: ${error.message}`);
            roundVotes.push(false);
            
            // Record failed response
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

        // Check consensus
        const allYes = roundVotes.length === this.config.agents.length && 
                       roundVotes.every(v => v === true);
        
        if (allYes) {
          this.log(`\n✅ Consensus reached! (Round ${round})\n`);
          session.status = 'consensus';
          break;
        } else {
          const yesCount = roundVotes.filter(v => v).length;
          this.log(`📊 Round votes: ${yesCount}/${this.config.agents.length} YES\n`);
        }
      }

      if (session.status === 'running') {
        session.status = 'max_rounds';
        this.log(`\n⚠️ Reached max rounds (${this.config.maxRounds}), ending collaboration\n`);
      }

      session.endTime = new Date().toISOString();

      // Generate summary
      session.finalSummary = this.generateSummary(session);
      this.log(`\n${'━'.repeat(60)}`);
      this.log(`\n${session.finalSummary}`);

      // Save transcript to working directory
      this.saveTranscript(session);

      return session;
    } catch (error: any) {
      session.status = 'error';
      session.endTime = new Date().toISOString();
      this.log(`\n❌ Error: ${error.message}`);
      throw error;
    }
  }

  private log(message: string) {
    if (!this.quiet) {
      console.log(message);
    }
  }

  private generateSummary(session: CouncilSession): string {
    const lines: string[] = [];
    
    lines.push(`# 📋 Collaboration Summary\n`);
    lines.push(`- **Task**: ${session.task}`);
    lines.push(`- **Status**: ${session.status === 'consensus' ? '✅ Consensus Reached' : '⚠️ Max Rounds Reached'}`);
    
    const maxRound = session.responses.length > 0 
      ? Math.max(...session.responses.map(r => r.round))
      : 0;
    lines.push(`- **Total Rounds**: ${maxRound}`);
    lines.push(`- **Working Directory**: ${session.config.projectDir}\n`);

    // Each agent's final response
    lines.push(`## Member Final Status\n`);
    const lastResponses = session.responses.filter(r => r.round === maxRound);
    
    for (const resp of lastResponses) {
      const agent = session.config.agents.find(a => a.name === resp.agent);
      const emoji = agent?.emoji || '🤖';
      lines.push(`### ${emoji} ${resp.agent}`);
      lines.push(`- **Consensus Vote**: ${resp.consensus ? '✅ YES' : '❌ NO'}`);
      
      // Extract key content
      const cleanContent = resp.content.replace(/\[CONSENSUS:\s*(YES|NO)\]/gi, '').trim();
      const preview = cleanContent.slice(0, 400) + (cleanContent.length > 400 ? '...' : '');
      lines.push(`- **Final Response**:\n${preview}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private saveTranscript(session: CouncilSession) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `three-minds-${timestamp}.md`;
    const filepath = path.join(this.config.projectDir, filename);

    let content = `# Three Minds Collaboration Transcript\n\n`;
    content += `- **Time**: ${session.startTime}\n`;
    content += `- **Task**: ${session.task}\n`;
    content += `- **Status**: ${session.status}\n\n`;
    content += `---\n\n`;

    let currentRound = 0;
    for (const resp of session.responses) {
      if (resp.round !== currentRound) {
        currentRound = resp.round;
        content += `## Round ${currentRound}\n\n`;
      }
      const agent = session.config.agents.find(a => a.name === resp.agent);
      const emoji = agent?.emoji || '🤖';
      content += `### ${emoji} ${resp.agent}\n\n`;
      content += resp.content + '\n\n';
    }

    content += `---\n\n`;
    content += session.finalSummary || '';

    fs.writeFileSync(filepath, content);
    this.log(`💾 Transcript saved: ${filepath}`);
  }
}

/**
 * Load configuration
 */
export async function loadConfig(configPath: string): Promise<CouncilConfig> {
  const configDir = path.join(__dirname, '..', 'configs');
  
  // Check built-in configs
  if (!configPath.includes('/') && !configPath.endsWith('.json')) {
    const builtinPath = path.join(configDir, `${configPath}.json`);
    try {
      const content = fs.readFileSync(builtinPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Continue trying as file path
    }
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Default configuration
 */
export function getDefaultConfig(projectDir: string): CouncilConfig {
  return {
    name: 'Code Collaboration Trio',
    agents: [
      {
        name: 'Architect',
        emoji: '🏗️',
        persona: `You are a system architect.
You focus on: code structure, design patterns, scalability, long-term maintainability.
You review overall code design and propose architectural improvements.
You can read files, modify code structure, refactor modules.`,
      },
      {
        name: 'Engineer',
        emoji: '⚙️',
        persona: `You are an implementation engineer.
You focus on: code quality, error handling, edge cases, performance optimization.
You actually write and modify code, ensuring correct implementation.
You can read files, write code, run tests.`,
      },
      {
        name: 'Reviewer',
        emoji: '🔍',
        persona: `You are a code reviewer.
You focus on: coding standards, potential bugs, security issues, documentation completeness.
You carefully review code, find issues, and propose fixes.
You can read files, add comments, fix obvious issues.`,
      },
    ],
    maxRounds: 15,
    projectDir,
  };
}
