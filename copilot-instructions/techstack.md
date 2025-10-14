# Eggstractor Tech Stack Analysis

## Core Technology Analysis

### Programming Languages

- **TypeScript** - Primary language for all packages with strict typing
- **JavaScript** - Limited use in build scripts and configuration files
- **CSS/SCSS** - Styling with SCSS preprocessing and CSS modules
- **HTML** - Basic template structure for Figma plugin UI

### Primary Framework

- **React 19.0.0** - Core UI framework with React Router DOM for navigation
- **Figma Plugin API** - Primary platform integration using Figma's plugin architecture

### Secondary/Tertiary Frameworks

- **Nx** - Monorepo management and build orchestration (v21.5.2)
- **Vite** - Build tool and development server for both UI and Figma packages
- **Vitest** - Testing framework with coverage and UI support
- **Playwright** - End-to-end testing framework

### State Management Approach

- **React Context** - Multiple context providers for configuration, generated styles, and status
- **Figma Client Storage** - Persistent storage for tokens, branch names, and configuration
- **Message Passing** - Communication between Figma plugin main thread and UI iframe

### Other Relevant Technologies

- **Tailwind CSS** - Utility-first CSS framework integration
- **Highlight.js** - Syntax highlighting for generated code output
- **GitHub API** - Direct integration for repository operations and PR creation
- **ESLint + Prettier** - Code quality and formatting with Figma-specific plugins
- **Husky + Lint-staged** - Git hooks for automated code quality checks

## Domain Specificity Analysis

### Problem Domain

**Design Token Extraction and Code Generation Platform** - Eggstractor is a Figma plugin that bridges the gap between design and development by automatically extracting design tokens from Figma designs and generating production-ready CSS code.

### Core Business Concepts

- **Design Token Extraction** - Automated analysis of Figma nodes to extract colors, spacing, typography, layouts, and effects
- **Multi-format Code Generation** - Transform design tokens into CSS, SCSS, and Tailwind utility classes
- **Git Workflow Integration** - Automated branch creation, file commits, and pull request generation
- **Figma Plugin Architecture** - Two-part system with main thread processing and UI iframe presentation

### User Interaction Types

- **Design Selection** - Users select Figma elements/pages to extract tokens from
- **Format Configuration** - Choice between CSS, SCSS, and Tailwind output formats
- **GitHub Integration** - Repository configuration, authentication, and automated git operations
- **Real-time Processing** - Live extraction and transformation with progress feedback
- **Code Preview** - Syntax-highlighted preview of generated stylesheets

### Primary Data Types and Structures

- **Token Collections** - Hierarchical structures containing style tokens, component tokens, and instance tokens
- **Design Processors** - Specialized processors for background, border, font, layout, and spacing extraction
- **Transformation Results** - Structured output containing generated code, warnings, and errors
- **GitHub Configurations** - Repository metadata, authentication tokens, and branch information
- **Figma Node Data** - Serialized design data including properties, styles, and effects

## Application Boundaries

### Features Clearly Within Scope

- Figma design token extraction (colors, typography, spacing, layouts, effects)
- CSS/SCSS/Tailwind code generation with proper formatting
- GitHub repository integration with automated git workflows
- Multi-package architecture supporting plugin and UI separation
- Real-time processing with progress tracking and error handling
- Component-based token organization and deduplication

### Architecturally Inconsistent Features

- **Non-Figma Design Tools** - Architecture is specifically built around Figma's API and data structures
- **Runtime CSS Application** - System generates static stylesheets, not dynamic styling solutions
- **Complex State Management** - Current message-passing architecture wouldn't support heavy client-side state
- **Multi-User Collaboration** - Single-user workflow focused on individual designer-developer handoffs
- **Database Integration** - No persistence layer beyond Figma's client storage and GitHub

### Specialized Dependencies and Domain Constraints

- **@figma/plugin-typings** - Strict dependency on Figma's plugin API and type definitions
- **Figma Node Processing** - All processors are designed around Figma's specific node types and properties
- **CSS Property Mapping** - Transformers have deep knowledge of CSS specification and browser compatibility
- **GitHub API Constraints** - Limited to GitHub's REST API capabilities and authentication flows
- **Monorepo Structure** - Nx-based architecture assumes multi-package development workflow
