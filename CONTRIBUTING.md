# Contributing to Pocket Flow TypeScript

Thank you for your interest in contributing to Pocket Flow! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the expectations for all contributors.

## Getting Started

### Prerequisites

- Node.js (recommended version: 18.x or later)
- npm (recommended version: 8.x or later)
- Git

### Setup Development Environment

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PocketFlow-Typescript.git
   cd PocketFlow-Typescript
   ```
3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/The-Pocket/PocketFlow-Typescript.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-you-are-fixing
   ```

2. Make your changes

3. Run tests to ensure your changes don't break existing functionality:

   ```bash
   npm test
   ```

4. Update documentation if necessary

5. Commit your changes with a descriptive commit message:

   ```bash
   git commit -m "Description of changes"
   ```

6. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request from your fork to the original repository

## Pull Request Process

1. Ensure your PR has a clear title and description
2. Link any relevant issues with "Fixes #issue-number" in the PR description
3. Make sure all tests pass
4. Request a code review from maintainers
5. Address any feedback from code reviews
6. Once approved, a maintainer will merge your PR

## Coding Standards

- Follow the established code style in the project
- Use TypeScript for type safety
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names
- Comment your code when necessary, but prefer self-documenting code
- Avoid any unnecessary dependencies

## Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for high test coverage
- Follow existing testing patterns

## Documentation

- Update relevant documentation for any new features
- Include JSDoc comments for public APIs
- Keep documentation up-to-date with code changes
- Consider adding examples for complex features

## Community

- Join our [Discord](https://discord.gg/hUHHE9Sa6T) for discussions and questions
- Be respectful and helpful to other community members
- Share knowledge and help others learn

Thank you for contributing to Pocket Flow!
