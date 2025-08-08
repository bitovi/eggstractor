const fs = require('fs');
const path = require('path');

// Read the generated HTML from UI build
const uiHtmlPath = path.join(__dirname, '../dist-ui/src/ui/index.html');
const outputPath = path.join(__dirname, '../dist/ui.html');

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(uiHtmlPath)) {
  // Copy the generated HTML to ui.html for Figma plugin
  fs.copyFileSync(uiHtmlPath, outputPath);
  console.log('✅ Generated ui.html for Figma plugin');

  // Clean up the dist-ui directory
  const distUiDir = path.join(__dirname, '../dist-ui');
  fs.rmSync(distUiDir, { recursive: true, force: true });
  console.log('✅ Cleaned up temporary UI build files');
} else {
  console.error('❌ UI build output not found at', uiHtmlPath);
  process.exit(1);
}

// Rename code.iife.js to code.js if it exists
const codeIifePath = path.join(__dirname, '../dist/code.iife.js');
const codeOutputPath = path.join(__dirname, '../dist/code.js');

if (fs.existsSync(codeIifePath)) {
  fs.renameSync(codeIifePath, codeOutputPath);
  console.log('✅ Renamed code.iife.js to code.js');
}
