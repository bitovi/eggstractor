# Tech Stack Analysis

## Core Technology Analysis

**Programming language(s)**: TypeScript as the primary language with JavaScript configuration files
**Primary framework**: Figma Plugin API - This is a Figma plugin built using the Figma Plugin API
**Secondary/tertiary frameworks**: 
- Webpack for bundling and build processes
- Jest for testing
- Tailwind CSS for styling
- SCSS/Sass for CSS preprocessing
- Highlight.js for syntax highlighting in the UI

**State management approach**: Simple in-memory state management using module-level variables (e.g., `generatedScss` in code.ts) and message passing between Figma plugin UI and backend via `figma.ui.postMessage` and `figma.ui.onmessage`.

**Other relevant technologies**:
- ESLint and Prettier for code quality
- HTML for plugin UI structure
- CSS with CSS variables for theming
- Node.js scripts for build tools

## Domain Specificity Analysis

**Problem domain**: Design token extraction and transformation - specifically a Figma plugin that extracts design system tokens (colors, typography, spacing, layout properties, etc.) from Figma designs and transforms them into CSS, SCSS, or Tailwind classes.

**Core concepts**:
- **Design token extraction**: Converting Figma design properties into reusable CSS variables and styles
- **Multi-format transformation**: Supporting SCSS mixins, CSS classes, Tailwind utility classes, and Tailwind v4 syntax
- **Style processing pipeline**: Node traversal → Token collection → Processing → Transformation
- **Figma API integration**: Working with Figma's scene nodes, variables, fills, fonts, layout properties
- **GitHub integration**: Creating branches, commits, and pull requests with generated styles

**User interactions**:
- **Design token generation**: Users select output format (SCSS, CSS, Tailwind) and generate styles from current Figma page
- **GitHub workflow integration**: Configure repository settings, create branches, and push generated styles directly to GitHub
- **Visual feedback**: Progress indicators, syntax-highlighted output, copy-to-clipboard functionality

**Primary data types and structures**:
- **Tokens**: BaseToken, StyleToken, VariableToken, ComponentToken, InstanceToken
- **Processors**: StyleProcessor functions that extract specific CSS properties from Figma nodes
- **Transformers**: Functions that convert token collections into different output formats
- **Figma node types**: SceneNode, ComponentNode, InstanceNode, TextNode, FrameNode with their properties

## Application Boundaries

**Features/functionality clearly within scope**:
- Extracting design tokens from Figma (colors, typography, spacing, borders, backgrounds, layouts)
- Converting Figma Auto Layout to CSS Flexbox properties
- Generating SCSS variables and mixins
- Generating CSS classes
- Generating Tailwind utility classes and SCSS mixins
- GitHub integration for automated deployment of styles
- Component variant handling and style inheritance
- Font and text styling extraction
- Background and fill processing (including gradients)
- Layout and spacing calculations

**Features that would be architecturally inconsistent**:
- Non-design-related functionality (this is specifically a design token extractor)
- Features not related to CSS/SCSS/Tailwind output formats
- Direct integration with other design tools besides Figma
- Complex state management or data persistence beyond the current message-passing architecture
- Features that don't follow the token → processor → transformer pipeline

**Specialized libraries and domain constraints**:
- **Figma Plugin API constraints**: Must work within Figma's plugin sandbox with specific capabilities
- **Design token semantics**: Understanding of CSS properties, Tailwind utility classes, SCSS syntax
- **Figma-to-CSS mapping**: Specific knowledge of how Figma properties translate to web standards
- **Token processing pipeline**: Follows a specific pattern of collection → processing → transformation
- **GitHub API integration**: Limited to repository file operations and branch management

The application is highly specialized for the design-to-development workflow, specifically bridging Figma designs and web CSS frameworks.
