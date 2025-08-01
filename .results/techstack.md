# Tech Stack Analysis

## Core Technology Analysis

**Programming Language:** TypeScript
- Primary codebase written in TypeScript with strict mode enabled
- Uses ES2021 target with modern language features

**Primary Framework:** Figma Plugin API
- Built as a Figma plugin using the official Figma Plugin API (version 1.0.0)
- Manifest-driven architecture for plugin configuration
- Dual environment support: Figma editor and Figma Dev mode

**Secondary/Tertiary Frameworks:**
- **Webpack:** Module bundler and build system for both main code and UI
- **Tailwind CSS:** Utility-first CSS framework for styling
- **Jest:** Testing framework with TypeScript support
- **ESLint + Prettier:** Code quality and formatting tools
- **Highlight.js:** Syntax highlighting for generated code output

**State Management Approach:**
- Simple message-based communication between plugin main thread and UI
- No complex state management library - uses native Figma plugin messaging API
- Local variables for storing generated output (SCSS/CSS)

**Other Relevant Technologies:**
- **culori:** Color manipulation and conversion library
- **lodash.merge:** Utility for deep merging objects
- **sass-rem:** SCSS/Sass utilities
- **lite-server:** Development server for visualization

## Domain Specificity Analysis

**Problem Domain:** Design token extraction and code generation for design systems
- Extracts design tokens (colors, spacing, typography, etc.) from Figma designs
- Transforms extracted tokens into CSS/SCSS variables and Tailwind utilities
- Automates the design-to-code workflow for design systems

**Core Concepts:**
- **Design Tokens:** Atomic design values (colors, spacing, typography, borders, etc.)
- **Style Processing:** Analyzing Figma nodes to extract style properties
- **Code Generation:** Converting design tokens to CSS/SCSS/Tailwind code
- **GitHub Integration:** Automated branch creation and pull request workflow
- **Format Transformation:** Multiple output formats (SCSS, CSS, Tailwind v3/v4)

**User Interactions:**
- Configure GitHub integration (token, repository, file paths, branch names)
- Generate styles from current Figma page/selection
- Choose output format (SCSS, CSS, Tailwind variations)
- Create GitHub pull requests with generated code
- Preview and export generated style code

**Primary Data Types:**
- **Figma Nodes:** Scene nodes, components, instances, text nodes
- **Style Tokens:** Color, typography, spacing, border, background properties
- **Design Variables:** Figma variables and their bindings
- **Generated Code:** SCSS/CSS/Tailwind string outputs
- **GitHub Metadata:** Repository paths, branch names, file contents

## Application Boundaries

**Features Within Scope:**
- Style extraction from Figma design files (current page)
- Multiple code format generation (SCSS, CSS, Tailwind)
- GitHub integration for automated PR creation
- Support for Figma variables and component variants
- Design token categorization and processing
- Syntax highlighting for generated code
- Development visualization tools

**Architecturally Inconsistent Features:**
- Multi-page processing across entire Figma files
- Database persistence or complex data storage
- Real-time collaboration features
- Advanced design editing capabilities
- Integration with design systems beyond code generation
- Complex user authentication beyond GitHub tokens
- File system operations beyond GitHub API

**Specialized Libraries/Domain Constraints:**
- **Figma Plugin API limitations:** Restricted to current page processing
- **culori:** Ensures consistent color space handling and conversion
- **GitHub API constraints:** Limited to repository operations via REST API
- **Webpack plugin architecture:** Requires specific bundling for Figma plugin format
- **Design token standards:** Follows design token community conventions
