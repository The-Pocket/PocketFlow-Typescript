<div align="center">
  <img src="https://raw.githubusercontent.com/The-Pocket/.github/main/assets/title.png" width="600"/>
</div>

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
[![Docs](https://img.shields.io/badge/docs-latest-blue)](https://the-pocket.github.io/PocketFlow/)
<a href="https://discord.gg/hUHHE9Sa6T">
<img src="https://img.shields.io/discord/1346833819172601907?logo=discord&style=flat">
</a>

# PocketFlow.js

PocketFlow.js is a TypeScript port of the original [Python version](https://github.com/The-Pocket/PocketFlow) - a minimalist LLM framework.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## Features

- **Lightweight**: Zero bloat, zero dependencies, zero vendor lock-in.

- **Expressive**: Everything you love—([Multi-](https://the-pocket.github.io/PocketFlow/design_pattern/multi_agent.html))[Agents](https://the-pocket.github.io/PocketFlow/design_pattern/agent.html), [Workflow](https://the-pocket.github.io/PocketFlow/design_pattern/workflow.html), [RAG](https://the-pocket.github.io/PocketFlow/design_pattern/rag.html), and more.

- **[Agentic Coding](https://zacharyhuang.substack.com/p/agentic-coding-the-most-fun-way-to)**: Let AI Agents (e.g., Cursor AI) build Agents—10x productivity boost!

## Installation

```bash
npm install pocketflow
```

Alternatively, you can simply copy the [source code](src/index.ts) directly into your project.

## Quick Start

```typescript
// Basic example coming soon
```

## Documentation

- Check out the [official documentation](https://the-pocket.github.io/PocketFlow/) for comprehensive guides and examples. The TypeScript version is still under development, so some features may not be available.
- For an in-depth design explanation, read our [design essay](https://github.com/The-Pocket/.github/blob/main/profile/pocketflow.md)

## Testing

To run tests locally:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Contributing

We welcome contributions from the community! Here's how you can help:

### Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to foster an inclusive community.

### CI/CD Workflow

We use GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Automatically runs tests and builds the project on each push and pull request to the main branch.
- **Code Quality**: Checks TypeScript compilation to ensure code quality.
- **Release**: Publishes the package to npm when a new release is created.

Note: To publish to npm, maintainers need to configure the `NPM_TOKEN` secret in the repository settings.

### How to Contribute

1. **Fork the Repository**

   - Create your own fork of the repo

2. **Create a Branch**

   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - For bug fixes, use (`git checkout -b fix/bug-description`)

3. **Make Your Changes**

   - Follow the code style and conventions
   - Add or update tests as needed
   - Keep your changes focused and related to a single issue

4. **Test Your Changes**

   - Ensure all tests pass with `npm test`
   - Add new tests if appropriate

5. **Commit Your Changes**

   - Use clear and descriptive commit messages
   - Reference issue numbers in commit messages when applicable

6. **Submit a Pull Request**
   - Provide a clear description of the changes
   - Link any related issues
   - Answer any questions or feedback during review

### Creating a CursorRule

To create a CursorRule to make AI agents work more effectively on the codebase:

1. Visit [gitingest.com](https://gitingest.com/)
2. Paste the link to the docs folder (e.g., https://github.com/The-Pocket/PocketFlow-Typescript/tree/main/docs) to generate content
3. Remove the following from the generated result:
   - All utility function files except for llm
   - The design_pattern/multi_agent.md file
   - All \_config.yaml and index.md files, except for docs/index.md
4. Save the result as a CursorRule to help AI agents understand the codebase structure better

### Development Setup

```bash
# Clone your forked repository
git clone https://github.com/yourusername/PocketFlow-Typescript.git
cd PocketFlow-Typescript

# Install dependencies
npm install

# Run tests
npm test
```

### Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Detailed steps to reproduce the issue
- Expected and actual behavior
- Environment information (OS, Node.js version, etc.)
- Any additional context or screenshots

## Community

- Join our [Discord server](https://discord.gg/hUHHE9Sa6T) for discussions and support
- Follow us on [GitHub](https://github.com/The-Pocket)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
