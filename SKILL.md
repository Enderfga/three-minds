---
name: three-minds
description: 三个能干活的 AI 分身协作系统。支持多模型（Claude/Gemini/GPT），各自调用原生 CLI 工具，共享同一个工作目录，多轮协作直到达成共识。适用于代码审查、方案评审、重构任务等需要多视角协作的场景。
version: 2.0.0
author: 莎莎大人
---

# Three Minds - 三个臭皮匠顶个诸葛亮

真正能干活的多 Agent 协作系统。不是纸上谈兵，而是真的能读文件、改代码、跑测试。

## 核心特性

- 🔧 **真正执行** - 每个 agent 都能读取文件、编写代码、运行测试
- 🤖 **多模型支持** - Claude/Gemini/GPT 三家顶级模型同时协作
- 👥 **多视角协作** - 三个不同人设的 agent 互相审核
- ✅ **共识机制** - 全员 YES 才结束，确保质量
- 📁 **共享目录** - 在同一个项目上协作
- 📝 **完整记录** - 自动保存讨论和改动历史

## 使用方法

```bash
# 基础用法
three-minds "审查并改进这个项目的代码质量" --dir ./my-project

# 使用代码审查配置（安全+性能+质量三人组）
three-minds "审查 src/ 目录的所有代码" --config code-review --dir ./project

# 指定最大轮数
three-minds "重构这个模块" --dir ./module --max-rounds 5

# 保存结果到 JSON
three-minds "任务描述" --dir ./project --output result.json
```

## 触发词

- "三个臭皮匠"
- "three minds"
- "多 agent 协作"
- "让三个 agent 一起审查"
- "协作完成这个任务"

## 预设配置

### 默认配置 - 代码协作三人组
- 🏗️ **架构师** - 关注代码结构、设计模式、可扩展性
- ⚙️ **工程师** - 关注代码质量、错误处理、性能优化
- 🔍 **审核员** - 关注代码规范、潜在 bug、文档完整性

### multi-model - 多模型协作组 ⭐
三家顶级 AI 联合协作，各自调用原生 CLI：

| Agent | 模型 | CLI 工具 |
|-------|------|---------|
| 🧠 GPT-5 | azure/gpt-5.2-chat | `codex` (OpenAI Codex CLI) |
| 💎 Gemini | gemini-3-pro-preview | `gemini` (Google Gemini CLI) |
| 🎭 Claude | claude-opus-4-6 | `claude` (Claude Code CLI) |

```bash
# 使用多模型配置
three-minds "审查这段代码的安全性" --config multi-model --dir ./project
```

### code-review - 代码审查三人组
- 🛡️ **安全专家** - 关注安全漏洞、注入风险、权限问题
- ⚡ **性能工程师** - 关注算法复杂度、内存使用、查询优化
- ✅ **质量审查员** - 关注可读性、命名规范、测试覆盖

## 自定义配置

创建 JSON 配置文件：

```json
{
  "name": "我的三人组",
  "agents": [
    {
      "name": "专家A",
      "emoji": "🎯",
      "model": "claude-opus-4-6",
      "persona": "你是一位...关注..."
    },
    {
      "name": "专家B",
      "emoji": "🔬",
      "model": "gemini-3-pro-preview",
      "persona": "你是一位...擅长..."
    },
    {
      "name": "专家C",
      "emoji": "📊",
      "model": "azure/gpt-5.2-chat",
      "persona": "你是一位...负责..."
    }
  ],
  "maxRounds": 10,
  "projectDir": "."
}
```

**模型自动选择 CLI：**

| 模型前缀 | CLI 工具 |
|---------|---------|
| `claude-*` | `claude` (Claude Code CLI) |
| `gemini-*` / `google/*` | `gemini` (Gemini CLI) |
| `gpt-*` / `o1` / `o3` / `o4` / `azure/*` | `codex` (Codex CLI) |

然后：`three-minds "任务" --config ./my-config.json`

## 工作流程

```
┌──────────────────────────────────────────┐
│              第 N 轮                      │
├──────────────────────────────────────────┤
│  🏗️ 架构师                               │
│  → 读取文件，审查结构                     │
│  → 执行必要的重构                         │
│  → 投票 [CONSENSUS: YES/NO]              │
├──────────────────────────────────────────┤
│  ⚙️ 工程师                               │
│  → 审查架构师的改动                       │
│  → 补充实现细节，修复问题                 │
│  → 投票 [CONSENSUS: YES/NO]              │
├──────────────────────────────────────────┤
│  🔍 审核员                               │
│  → 审查所有改动                          │
│  → 检查规范、bug、文档                    │
│  → 投票 [CONSENSUS: YES/NO]              │
└──────────────────────────────────────────┘
          ↓
    全员 YES？→ 结束
          ↓ NO
    继续下一轮...
```

## 输出

1. **终端实时输出** - 每个 agent 的工作进展和投票
2. **Markdown 记录** - 自动保存在工作目录 `three-minds-{timestamp}.md`
3. **JSON 结果** - 使用 `--output` 保存完整 session 数据

## 使用场景

- **代码审查** - 多角度审查 PR 或代码变更
- **重构任务** - 协作完成复杂的代码重构
- **新功能开发** - 从设计到实现的完整协作
- **Bug 修复** - 定位问题并验证修复
- **文档完善** - 补充和改进项目文档

## 注意事项

- 需要安装 Claude Code CLI (`claude` 命令)
- 每个 agent 会真的修改文件，建议在 git 分支上使用
- 默认最大 15 轮，可通过 `--max-rounds` 调整
- 如果长时间无法达成共识，检查任务描述是否清晰

## 依赖

- Node.js 18+
- **必需 CLI（按使用的模型）：**
  - `claude` - Claude Code CLI（Claude 模型）
  - `gemini` - Google Gemini CLI（Gemini 模型）
  - `codex` - OpenAI Codex CLI（GPT/Azure 模型）
- **API Keys：** 各模型对应的 API key 需在环境变量中配置
