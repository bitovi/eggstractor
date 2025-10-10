# CSS Visualizer

A simple tool that automatically creates a visual representation of your CSS classes. It's particularly useful for visualizing design systems, component libraries, and CSS frameworks.

## How It Works

1. The tool reads your CSS classes from `styles.css`
2. Creates a visual representation of each class
3. Automatically organizes related classes (using underscore naming convention)
4. Shows text samples for typography-related styles
5. Live-reloads whenever you update your CSS

## Features

- **Auto-organization**: Classes with underscores (e.g., `button_primary`, `button_secondary`) are automatically nested under their parent class (`button`)
- **Live Preview**: Changes to `styles.css` trigger an automatic reload and update
- **Typography Preview**: Classes containing font or text-related properties automatically show sample text
- **Visual Hierarchy**: Each class is displayed in its own container with its name and styling applied
- **Responsive Layout**: Child elements are automatically arranged in an evenly distributed grid

## Usage

1. Clone this repository
2. Start the development server:
   ```bash
   npm start
   ```
3. Open `styles.css` and add your CSS classes
4. The page will automatically reload and display your styles

### Example

If you add these classes to `styles.css`:
