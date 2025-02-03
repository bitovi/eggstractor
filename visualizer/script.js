// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Get all CSS rules from the stylesheet
  const styleSheet = document.styleSheets[0];
  const rules = styleSheet.cssRules;

  // Create container
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '20px';
  container.style.padding = '20px';
  container.style.margin = '0 auto';
  document.body.appendChild(container);

  // Create a map to store parent-child relationships
  const classMap = new Map();

  // First pass: organize classes into hierarchy
  for (let rule of rules) {
    if (rule.selectorText && rule.selectorText.startsWith('.')) {
      const className = rule.selectorText.substring(1); // Remove the '.'
      const parts = className.split('_');
      
      if (parts.length === 1) {
        // This is a parent class
        if (!classMap.has(className)) {
          classMap.set(className, {
            rule: rule,
            children: []
          });
        }
      } else {
        // This is a child class
        const parentName = parts[0];
        if (!classMap.has(parentName)) {
          classMap.set(parentName, {
            rule: null,
            children: []
          });
        }
        classMap.get(parentName).children.push({
          className: className,
          rule: rule
        });
      }
    }
  }

  // Second pass: create elements
  for (let [className, data] of classMap) {
    // Create wrapper
    const wrapper = document.createElement('div');
    // wrapper.style.padding = '20px';
    wrapper.style.border = '1px solid #ddd';
    wrapper.style.borderRadius = '4px';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';

    // Create parent element if it has a rule
    if (data.rule) {
      const label = document.createElement('div');
      const cssText = data.rule.cssText.toLowerCase();
      label.textContent = data.rule.selectorText;
      wrapper.appendChild(label);

      const element = document.createElement('div');
      element.className = className;
      element.style.minHeight = '150px';
      
      if (cssText.includes('font') || cssText.includes('text')) {
        element.textContent = 'The quick brown fox jumps over the lazy dog';
      }
      if (!cssText.includes('background')) {
        element.style.backgroundColor = 'purple';
      }

      // Add children inside the parent element
      if (data.children.length > 0) {
        const widthPercent = Math.floor(100 / data.children.length);
        
        for (let child of data.children) {
          const childWrapper = document.createElement('div');
          childWrapper.textContent = child.rule.selectorText;
          childWrapper.className = child.className;
          childWrapper.style.flexBasis = `${widthPercent}%`;
          childWrapper.style.boxSizing = 'border-box';

          element.appendChild(childWrapper);
        }
      }
      
      wrapper.appendChild(element);
    }

    container.appendChild(wrapper);
  }
}); 