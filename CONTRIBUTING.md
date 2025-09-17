# Contributing to MCP Joplin Server

Thank you for your interest in contributing to MCP Joplin Server! We welcome contributions from the community and are pleased to have you aboard.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Joplin Desktop application
- Basic knowledge of TypeScript and the Model Context Protocol (MCP)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-joplin.git
   cd mcp-joplin
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up Joplin**:
   - Ensure Joplin Desktop is running
   - Enable Web Clipper service in Tools → Options → Web Clipper
   - Note the API token and port number

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Test the setup**:
   ```bash
   npm start -- --token YOUR_API_TOKEN
   ```

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker to report bugs
- Include as much detail as possible:
  - Operating system and version
  - Node.js version
  - Joplin version
  - Steps to reproduce the issue
  - Expected vs actual behavior
  - Error messages and logs

### Suggesting Features

- Use GitHub issues to suggest new features
- Explain the use case and why it would be valuable
- Consider how it aligns with the project's goals

### Contributing Code

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run build
   npm start -- --token YOUR_API_TOKEN
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Pull Request Process

1. **Ensure CI passes**: All checks must pass before merge
2. **Update documentation**: Include relevant documentation updates
3. **Add tests**: If adding new functionality, include appropriate tests
4. **Follow commit conventions**: Use conventional commit messages
5. **Request review**: Wait for maintainer review and address feedback

### Commit Message Convention

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or updating tests
- `chore:` for maintenance tasks

Examples:
```
feat: add notebook search functionality
fix: resolve pagination issue in getNotes
docs: update installation instructions
```

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** to ensure it's not a usage question
3. **Test with the latest version** to see if the issue still exists

### Issue Templates

Please use the appropriate issue template:
- **Bug Report**: For reporting bugs and unexpected behavior
- **Feature Request**: For suggesting new features or enhancements

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Follow existing naming conventions

### Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Maximum line length: 100 characters

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
└── joplin-client.ts  # Joplin API client
```

## Testing

### Manual Testing

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Test with different scenarios**:
   - Test with and without API token
   - Test various MCP tools
   - Test error handling

3. **Verify MCP integration**:
   - Test with Claude Desktop or other MCP clients
   - Verify all tools are properly registered

### Integration Testing

- Ensure Joplin connectivity works
- Test all MCP tools function correctly
- Verify error handling and edge cases

## Documentation

### README Updates

- Keep the README.md up to date with new features
- Include clear examples and usage instructions
- Update configuration examples when needed

### Code Documentation

- Add JSDoc comments for new functions
- Document complex logic and algorithms
- Include parameter and return type documentation

## Release Process

1. **Version Bumping**: Use semantic versioning
   ```bash
   npm version patch  # Bug fixes
   npm version minor  # New features
   npm version major  # Breaking changes
   ```

2. **Update CHANGELOG**: Document all changes

3. **Create Release**: Tag and create GitHub release

4. **Publish to NPM**: Automated via CI/CD

## Questions and Support

- **General Questions**: Use GitHub Discussions
- **Bug Reports**: Use GitHub Issues
- **Feature Requests**: Use GitHub Issues
- **Security Issues**: Email maintainers directly

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to MCP Joplin Server! 🚀