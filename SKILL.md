---
name: three-minds
description: A multi-agent collaboration system using Claude Code. Spawns three AI agents with different personas to work together on the same codebase. They can read files, write code, run tests, and vote on consensus.
version: 2.0.0
---

# Three Minds - 三个臭皮匠顶个诸葛亮

A real multi-agent collaboration system. Not just talking—they actually read files, write code, and run tests.

## Core Features

- 🔧 **Real Execution** - Each agent can read files, write code, run tests
- 👥 **Multi-Perspective** - Three agents with different expertise review each other's work
- ✅ **Consensus Voting** - All must vote YES to finish, ensuring quality
- 📁 **Shared Workspace** - Collaborate on the same project directory
- 📝 **Full Transcript** - Auto-saves discussion and changes history

## Usage

```bash
# Basic usage
three-minds "Review and improve this project's code quality" --dir ./my-project

# Use code-review preset (security + performance + quality trio)
three-minds "Review all code in src/" --config code-review --dir ./project

# Specify max rounds
three-minds "Refactor this module" --dir ./module --max-rounds 5

# Save result to JSON
three-minds "task description" --dir ./project --output result.json
```

## Trigger Words

- "three minds"
- "multi-agent collaboration"
- "let three agents review"
- "collaborative task"

## Preset Configurations

### Default - Code Collaboration Trio
- 🏗️ **Architect** - Code structure, design patterns, scalability
- ⚙️ **Engineer** - Code quality, error handling, performance
- 🔍 **Reviewer** - Code standards, potential bugs, documentation

### code-review - Code Review Trio
- 🛡️ **Security Expert** - Vulnerabilities, injection risks, permissions
- ⚡ **Performance Engineer** - Algorithm complexity, memory, query optimization
- ✅ **Quality Reviewer** - Readability, naming conventions, test coverage

## Custom Configuration

Create a JSON config file:

```json
{
  "name": "My Custom Trio",
  "agents": [
    {
      "name": "Expert A",
      "emoji": "🎯",
      "persona": "You are a... focusing on..."
    },
    {
      "name": "Expert B",
      "emoji": "🔬",
      "persona": "You are a... specializing in..."
    },
    {
      "name": "Expert C",
      "emoji": "📊",
      "persona": "You are a... responsible for..."
    }
  ],
  "maxRounds": 10,
  "projectDir": "."
}
```

Then: `three-minds "task" --config ./my-config.json`

## Workflow

```
┌──────────────────────────────────────────┐
│              Round N                      │
├──────────────────────────────────────────┤
│  🏗️ Architect                            │
│  → Reads files, reviews structure         │
│  → Executes necessary refactoring         │
│  → Votes [CONSENSUS: YES/NO]             │
├──────────────────────────────────────────┤
│  ⚙️ Engineer                             │
│  → Reviews architect's changes            │
│  → Implements details, fixes issues       │
│  → Votes [CONSENSUS: YES/NO]             │
├──────────────────────────────────────────┤
│  🔍 Reviewer                             │
│  → Reviews all changes                    │
│  → Checks standards, bugs, docs           │
│  → Votes [CONSENSUS: YES/NO]             │
└──────────────────────────────────────────┘
          ↓
    All YES? → Done
          ↓ NO
    Continue next round...
```

## Output

1. **Terminal Output** - Real-time progress and voting
2. **Markdown Transcript** - Auto-saved in project dir `three-minds-{timestamp}.md`
3. **JSON Result** - Use `--output` to save full session data

## Use Cases

- **Code Review** - Multi-perspective PR review
- **Refactoring** - Collaborative complex refactoring
- **New Features** - Design to implementation collaboration
- **Bug Fixing** - Locate and verify fixes
- **Documentation** - Improve project documentation

## Requirements

- Node.js 18+
- Claude Code CLI (`claude` command available)

## Notes

- Each agent actually modifies files—recommend using on git branches
- Default max 15 rounds, adjust with `--max-rounds`
- If consensus takes too long, check if task description is clear
