# Three Minds 🧠🧠🧠

**Multi-Agent Collaboration System** - Three AI agents working together on the same codebase. Not just talking—they actually read files, write code, and run tests.

## What's Special?

Three Minds uses **Claude Code** as the unified agent framework, with proxy support for **any model** (GPT, Gemini, etc.). This means:

- 🔧 **Full Agent Loop** - Every model gets Claude Code's powerful tool use capabilities
- 🤖 **True Multi-Model** - GPT, Gemini, Claude debating with the same capabilities
- 👥 **Real Collaboration** - Three agents review each other's actual code changes

## Requirements

- Node.js 18+
- **Claude Code CLI** (`claude` command must be available)
- **[claude-code-skill](https://github.com/Enderfga/openclaw-claude-code-skill)** (required for multi-model proxy)

## Installation

```bash
# Clone
git clone https://github.com/Enderfga/three-minds.git
cd three-minds

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

## Quick Start

```bash
# Basic usage (3 Claude agents)
three-minds "Review and improve this project's code quality" --dir ./my-project

# Multi-model: GPT + Gemini + Claude 🌐
three-minds "Design a scalable API" --config multi-model --dir ./project

# Code review preset
three-minds "Review all code in src/" --config code-review --dir ./project
```

## Multi-Model Support 🌐

Three Minds supports **any model** through Claude Code's proxy feature. All agents share the same powerful tool use capabilities—only the "brain" differs.

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GPT-4o    │     │  Gemini 2.0 │     │   Claude    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Claude Code Agent Framework              │
│  (tool use, file ops, code execution, multi-turn)    │
└──────────────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   via proxy           via proxy            direct
```

### Setup Multi-Model

1. **Start the proxy** (from [claude-code-skill](https://github.com/Enderfga/openclaw-claude-code-skill)):

```bash
# Using claude-code-proxy
cd ~/claude-code-proxy && source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8082
```

2. **Run with multi-model config**:

```bash
three-minds "Design and implement a REST API" --config multi-model --dir ./project
```

### Custom Multi-Model Config

```json
{
  "name": "My AI Team",
  "agents": [
    {
      "name": "GPT",
      "emoji": "🧠",
      "model": "gpt-4o",
      "baseUrl": "http://127.0.0.1:8082",
      "persona": "You are GPT-4o, focusing on logical analysis..."
    },
    {
      "name": "Gemini",
      "emoji": "💎",
      "model": "gemini-2.0-flash",
      "baseUrl": "http://127.0.0.1:8082",
      "persona": "You are Gemini, focusing on creative solutions..."
    },
    {
      "name": "Claude",
      "emoji": "🎭",
      "model": "claude-sonnet-4-20250514",
      "persona": "You are Claude, focusing on code quality..."
    }
  ],
  "maxRounds": 10
}
```

| Field | Description |
|-------|-------------|
| `model` | Model name (e.g., `gpt-4o`, `gemini-2.0-flash`) |
| `baseUrl` | Proxy endpoint for non-Claude models |

## Preset Configurations

### multi-model ⭐ - Mixed AI Collaboration

| Agent | Model | Via |
|-------|-------|-----|
| 🧠 GPT | gpt-4o | proxy |
| 💎 Gemini | gemini-2.0-flash | proxy |
| 🎭 Claude | claude-sonnet-4 | direct |

### default - Code Collaboration Trio
- 🏗️ **Architect** - Code structure, design patterns, scalability
- ⚙️ **Engineer** - Code quality, error handling, performance
- 🔍 **Reviewer** - Code standards, potential bugs, documentation

### code-review - Code Review Trio
- 🛡️ **Security Expert** - Vulnerabilities, injection risks, permissions
- ⚡ **Performance Engineer** - Algorithm complexity, memory, query optimization
- ✅ **Quality Reviewer** - Readability, naming conventions, test coverage

### idea-brainstorm - Research Brainstorm Trio
- 📚 **Literature Expert** - Related work, theoretical foundations
- 💡 **Creative Thinker** - Novel approaches, unconventional ideas
- 🔬 **Feasibility Analyst** - Technical constraints, implementation path

## Usage

```bash
# Basic usage
three-minds "task description" --dir ./project

# Use a preset config
three-minds "task" --config code-review --dir ./project

# Custom config file
three-minds "task" --config ./my-config.json --dir ./project

# Specify max rounds
three-minds "task" --dir ./project --max-rounds 5

# Save result to JSON
three-minds "task" --dir ./project --output result.json

# Quiet mode
three-minds "task" --dir ./project --quiet --output result.json
```

## How It Works

```
┌──────────────────────────────────────────┐
│              Round N                      │
├──────────────────────────────────────────┤
│  🏗️ Agent 1                              │
│  → Reads files, reviews structure         │
│  → Executes necessary changes             │
│  → Votes [CONSENSUS: YES/NO]             │
├──────────────────────────────────────────┤
│  ⚙️ Agent 2                              │
│  → Reviews Agent 1's changes              │
│  → Implements improvements                │
│  → Votes [CONSENSUS: YES/NO]             │
├──────────────────────────────────────────┤
│  🔍 Agent 3                              │
│  → Reviews all changes                    │
│  → Checks standards and quality           │
│  → Votes [CONSENSUS: YES/NO]             │
└──────────────────────────────────────────┘
          ↓
    All YES? → Done
          ↓ NO
    Continue next round...
```

## Output

1. **Terminal Output** - Real-time progress and voting results
2. **Markdown Transcript** - Auto-saved as `three-minds-{timestamp}.md`
3. **JSON Result** - Use `--output result.json` for full session data

## Use Cases

- **Code Review** - Multi-perspective PR review
- **Refactoring** - Collaborative complex code refactoring
- **New Features** - Design to implementation collaboration
- **Bug Fixing** - Locate problems and verify fixes
- **Documentation** - Improve project documentation
- **Research** - Brainstorm and evaluate ideas

## Environment Setup

Create `~/.openclaw/.env` with your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

For multi-model, the proxy handles API keys for other providers.

## Notes

- Each agent actually modifies files—recommend using on git branches
- Default max 15 rounds, adjust with `--max-rounds`
- Each agent has 5 minute timeout per round
- Multi-model requires the proxy server running

## Related Projects

- **[claude-code-skill](https://github.com/Enderfga/openclaw-claude-code-skill)** - Required for multi-model proxy support

## License

MIT
