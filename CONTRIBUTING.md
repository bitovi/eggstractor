# Contributing to Eggstractor

Thank you for your interest in contributing to Eggstractor! This document provides guidelines and information about contributing to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Adding New Features](#adding-new-features)
- [Style Guide](#style-guide)
- [Submitting Changes](#submitting-changes)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/bitovi/eggstractor.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Process

1. Make your changes in your feature branch
2. Run the plugin in Figma to test your changes

- Run `npm run dev` to start the plugin in watch mode
- Load the plugin in Figma and test your changes

3. Write or update tests as needed
4. Run tests: `npm test`
5. Run the visualizer to check your changes: `npm run visualizer`

## Project Structure

```
src/
├── processors/ # property processors
│ ├── layout.processor.ts
│ ├── spacing.processor.ts
│ ├── border.processor.ts
│ ├── font.processor.ts
│ ├── gradient.processor.ts
│ └── background.processor.ts
├── services/ # data collection services
│ ├── collection.service.ts
│ ├── variable.service.ts
│ └── token.service.ts
├── transformers/ # data transformation services
│ ├── css.transformer.ts
│ └── scss.transformer.ts
├── tests/ # Test files
│ ├── fixtures/ # Test data
│ └── snapshots/ # Test snapshots
├── types/ # TypeScript type definitions
└── utils/ # Utility functions
visualizer/ # Visual testing tool
├── script.js
└── styles.css
```

## Testing

### Adding New Tests

1. Create test fixtures in `src/tests/fixtures/`
2. Add test cases in the appropriate test file
3. Run tests: `npm test`
4. Update snapshots if needed: `npm test -- -u`

### Using the Visualizer

The visualizer helps you see how your changes affect the CSS output:

1. Run `npm run visualizer`
2. Open `http://localhost:3000` in your browser
3. Check that your changes produce the expected CSS output
4. Copy/Paste the css output from the Figma plugin in Figma to the visualizer to verify the output

## Adding New Features

### Adding a New Processor

1. Create a new file in `src/processors/`
2. Follow the existing processor pattern:

```typescript
export const newProcessor: StyleProcessor[] = [
  {
    property: 'css-property',
    bindingKey: 'figmaProperty',
    process: async (variables, node?) => {
      // Your processing logic here
      return {
        value: 'processed-value',
        rawValue: 'raw-value',
        valueType: 'unit',
      };
    },
  },
];
```

3. Add tests in `src/tests/`
4. Update `src/processors/index.ts` to include your processor

## Style Guide

- Use TypeScript for all new code
- Follow existing code formatting (enforced by ESLint/Prettier)
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation when adding new features

## Submitting Changes

1. Push your changes to your fork
2. Create a Pull Request (PR) to the main repository
3. Ensure all tests pass
4. Wait for review

### PR Requirements

- Clear description of changes
- Tests for new functionality
- Updated documentation if needed
- Passes all existing tests
- Follows style guidelines

## Questions?

If you have questions or need help:

1. Check existing issues
2. Create a new issue for discussion
3. Tag with appropriate labels

Thank you for contributing to Eggstractor!
