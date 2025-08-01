# Figma Plugin UI Style Guide

## Overview
The Figma plugin UI provides the interface for users to configure GitHub integration, select output formats, and trigger design token generation. It handles form validation, progress indication, and real-time preview.

## File Structure
- `src/ui.html` - HTML structure and form elements
- `src/ui.ts` - TypeScript logic for UI interactions and messaging
- `src/ui.css` - Styling and layout

## Core Patterns

### DOM Element Access Pattern
```typescript
// Type-safe DOM element access
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const repoPathInput = document.getElementById('repoPath') as HTMLInputElement;
const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
```

### Plugin Message Communication Pattern
```typescript
// Send message to plugin main thread
parent.postMessage({ 
  pluginMessage: { 
    type: 'action-type',
    data: formData 
  } 
}, '*');

// Listen for messages from plugin
window.addEventListener('message', (event) => {
  const { type, data } = event.data.pluginMessage || {};
  
  switch (type) {
    case 'response-type':
      handleResponse(data);
      break;
  }
});
```

### Configuration Persistence Pattern
```typescript
function saveConfig() {
  const config = {
    repoPath: repoPathInput.value,
    filePath: filePathInput.value,
    outputFormat: formatSelect.value,
  };
  
  parent.postMessage({ 
    pluginMessage: { 
      type: 'save-config', 
      config 
    } 
  }, '*');
}

// Auto-save on input changes
repoPathInput.onchange = saveConfig;
filePathInput.onchange = saveConfig;
formatSelect.onchange = saveConfig;
```

### Progress Indication Pattern
```typescript
function updateProgress(progress: number, message: string) {
  const progressFill = document.getElementById('progressFill') as HTMLDivElement;
  const progressText = document.getElementById('progressText') as HTMLDivElement;
  
  progressFill.style.width = `${progress}%`;
  progressText.textContent = message;
}

function showSpinner() {
  const spinner = document.getElementById('spinner') as HTMLDivElement;
  spinner.style.display = 'block';
}
```

## Form Validation

### Input Validation Pattern
```typescript
branchNameInput.onchange = () => {
  // Git branch naming validation
  const branchName = branchNameInput.value;
  const isValid = /^[a-zA-Z0-9._/-]+$/.test(branchName) && 
                  !branchName.startsWith('.') &&
                  !branchName.includes('//');
  
  if (!isValid) {
    showValidationError('Invalid branch name format');
    return;
  }
  
  saveConfig();
};
```

### Required Field Validation
```typescript
function validateRequiredFields(): boolean {
  const requiredFields = [
    { element: githubTokenInput, name: 'GitHub Token' },
    { element: repoPathInput, name: 'Repository Path' },
    { element: filePathInput, name: 'File Path' },
    { element: branchNameInput, name: 'Branch Name' }
  ];
  
  for (const field of requiredFields) {
    if (!field.element.value.trim()) {
      showError(`${field.name} is required`);
      return false;
    }
  }
  
  return true;
}
```

### Format Validation
```typescript
function validateRepoPath(repoPath: string): boolean {
  // owner/repo format validation
  const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  return repoPattern.test(repoPath);
}

function validateFilePath(filePath: string): boolean {
  // Basic file path validation
  return filePath.length > 0 && !filePath.includes('..') && !filePath.startsWith('/');
}
```

## UI State Management

### Button State Management
```typescript
function setButtonLoading(button: HTMLButtonElement, loading: boolean) {
  button.disabled = loading;
  button.textContent = loading ? 'Processing...' : button.dataset.originalText || 'Generate';
  
  if (loading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}
```

### Development Controls
```typescript
// Show/hide development features
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  devControls.style.display = 'block';
  const exportBtn = document.getElementById('exportTestDataBtn');
  if (exportBtn) {
    exportBtn.style.display = 'inline-block';
  }
}
```

### Theme Integration
```typescript
function applyTheme(theme: 'light' | 'dark') {
  document.body.className = `theme-${theme}`;
  
  // Update syntax highlighting theme
  const codeElements = document.querySelectorAll('pre code');
  codeElements.forEach(element => {
    highlightCode(element as HTMLElement, theme);
  });
}
```

## Event Handling

### Form Submission Pattern
```typescript
generateBtn.onclick = async () => {
  if (!validateRequiredFields()) return;
  
  setButtonLoading(generateBtn, true);
  showProgress(0, 'Starting generation...');
  
  try {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'generate-tokens',
        format: formatSelect.value 
      } 
    }, '*');
  } catch (error) {
    showError('Generation failed');
    setButtonLoading(generateBtn, false);
  }
};
```

### GitHub PR Creation
```typescript
createPRBtn.onclick = async () => {
  if (!generatedScss) {
    showError('Please generate tokens first');
    return;
  }
  
  if (!validateRequiredFields()) return;
  
  const config = {
    token: githubTokenInput.value,
    repoPath: repoPathInput.value,
    filePath: filePathInput.value,
    branchName: branchNameInput.value,
  };
  
  parent.postMessage({ 
    pluginMessage: { 
      type: 'create-pr', 
      config 
    } 
  }, '*');
};
```

## Message Handling

### Response Processing
```typescript
window.addEventListener('message', (event) => {
  const { type, data, error } = event.data.pluginMessage || {};
  
  switch (type) {
    case 'generation-complete':
      handleGenerationComplete(data);
      break;
      
    case 'generation-progress':
      updateProgress(data.progress, data.message);
      break;
      
    case 'pr-created':
      handlePRCreated(data);
      break;
      
    case 'error':
      showError(error);
      break;
      
    case 'config-loaded':
      loadConfigurationData(data);
      break;
  }
});
```

### Code Preview
```typescript
function displayGeneratedCode(code: string, format: string) {
  const previewContainer = document.getElementById('codePreview');
  const codeElement = document.createElement('code');
  
  codeElement.textContent = code;
  codeElement.className = `language-${format}`;
  
  // Apply syntax highlighting
  highlightCode(codeElement);
  
  previewContainer.innerHTML = '';
  previewContainer.appendChild(codeElement);
}
```

## CSS Integration

### Layout Structure
```html
<div class="container">
  <div class="form-group">
    <label for="input">Label:</label>
    <input type="text" id="input" placeholder="Placeholder text" />
  </div>
  
  <div class="button-group">
    <button id="primaryBtn" class="btn btn-primary">Primary Action</button>
    <button id="secondaryBtn" class="btn btn-secondary">Secondary Action</button>
  </div>
  
  <div class="progress-container">
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div class="progress-text">Progress message</div>
  </div>
</div>
```

### Responsive Design
```css
.container {
  padding: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
```

## Best Practices

### 1. Type Safety
Always cast DOM elements to specific types:
```typescript
const input = document.getElementById('input') as HTMLInputElement;
```

### 2. Error Handling
Provide clear error messages and recovery options:
```typescript
function showError(message: string) {
  const errorElement = document.getElementById('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}
```

### 3. User Feedback
Provide immediate feedback for user actions:
```typescript
input.oninput = () => {
  validateInput(input.value);
  saveConfig();
};
```

### 4. Accessibility
Include proper labels and ARIA attributes:
```html
<label for="repoPath">Repository Path:</label>
<input 
  type="text" 
  id="repoPath" 
  aria-describedby="repoPathHelp"
  required 
/>
<div id="repoPathHelp" class="help-text">
  Format: owner/repository-name
</div>
```

### 5. State Persistence
Save user input to prevent data loss:
```typescript
// Auto-save on input changes
input.addEventListener('input', debounce(saveConfig, 500));
```

## Testing Requirements
- Test form validation with various input combinations
- Test message communication between UI and plugin core
- Test progress indication and loading states
- Test error handling and recovery
- Test configuration persistence
- Test development mode features
- Validate accessibility compliance
- Test responsive layout on different screen sizes
