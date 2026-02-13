# Three Minds 🧠🧠🧠

**Multi-Agent Collaboration System** - Three AI agents working together on the same codebase. Not just talking—they actually read files, write code, and run tests.

## Features

- 🔧 **Real Execution** - Each agent can read files, write code, run tests via Claude Code CLI
- 👥 **Multi-Perspective** - Three agents with different expertise review each other's work
- ✅ **Consensus Voting** - All must vote YES to finish, ensuring quality
- 📁 **Shared Workspace** - Collaborate on the same project directory
- 📝 **Full Transcript** - Auto-saves discussion and changes history

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

## Requirements

- Node.js 18+
- **Claude Code CLI** (`claude` command must be available)

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

# Quiet mode (no terminal output)
three-minds "task" --dir ./project --quiet --output result.json
```

## Preset Configurations

### Default - Code Collaboration Trio
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

### paper-writing - Paper Writing Trio
- 📝 **Content Reviewer** - Argument structure, logical flow
- ✍️ **Language Editor** - Grammar, clarity, academic tone
- 🎨 **Presentation Advisor** - Figures, tables, visual organization

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

Then run:

```bash
three-minds "task description" --config ./my-config.json --dir ./project
```

## How It Works

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

1. **Terminal Output** - Real-time progress and voting results
2. **Markdown Transcript** - Auto-saved in project directory as `three-minds-{timestamp}.md`
3. **JSON Result** - Use `--output result.json` to save full session data

## Use Cases

- **Code Review** - Multi-perspective PR review
- **Refactoring** - Collaborative complex code refactoring
- **New Features** - Design to implementation collaboration
- **Bug Fixing** - Locate problems and verify fixes
- **Documentation** - Improve project documentation
- **Research** - Brainstorm and evaluate ideas
- **Writing** - Collaborative paper or doc writing

## Notes

- Each agent actually modifies files—recommend using on git branches
- Default max 15 rounds, adjust with `--max-rounds`
- If consensus takes too long, check if task description is clear
- Each agent has 5 minute timeout per round

## License

MIT
