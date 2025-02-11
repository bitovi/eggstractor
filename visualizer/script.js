const textContent = `The quick brown fox jumps over the lazy dog`;

// Run when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Get all CSS rules from the stylesheet
  const styleSheet = document.styleSheets[0];
  const rules = styleSheet.cssRules;

  // Create main wrapper
  const mainWrapper = document.createElement("div");
  mainWrapper.style.display = "flex";
  mainWrapper.style.flexDirection = "column";
  mainWrapper.style.gap = "20px";
  mainWrapper.style.padding = "20px";
  mainWrapper.style.margin = "0px auto";
  document.body.appendChild(mainWrapper);

  // Create a map to store nested class relationships
  const classMap = new Map();

  // First pass: organize classes into nested hierarchy
  for (let rule of rules) {
    if (rule.selectorText && rule.selectorText.startsWith(".")) {
      const className = rule.selectorText.substring(1);
      const parts = className.split("_");

      // Get or create parent entry
      const parentName = parts[0];
      if (!classMap.has(parentName)) {
        classMap.set(parentName, {
          rule: null,
          children: new Map(),
        });
      }

      if (parts.length === 1) {
        // This is the parent class
        classMap.get(parentName).rule = rule;
      } else {
        // Build nested structure
        let currentMap = classMap.get(parentName).children;
        let currentPath = parentName;

        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          currentPath = `${currentPath}_${part}`;

          if (!currentMap.has(part)) {
            currentMap.set(part, {
              rule: currentPath === className ? rule : null,
              children: new Map(),
              className: currentPath,
            });
          }
          currentMap = currentMap.get(part).children;
        }
      }
    }
  }

  function createElements(data, className) {
    const element = document.createElement("div");
    element.className = className;
    element.style.boxSizing = "border-box";

    // Add CSS text checking logic for parent elements
    if (data.rule) {
      const cssText = data.rule.style.cssText.toLowerCase();
      if (cssText.includes("font") || cssText.includes("text")) {
        element.textContent = textContent;
        if (!cssText.includes("background")) {
          element.style.backgroundColor = "purple";
        }
      }
    }

    if (data.children.size > 0) {
      const totalChildren = data.children.size;
      for (let [childName, childData] of data.children) {
        const childElement = createElements(childData, childData.className);
        childElement.style.flexBasis = `${100 / totalChildren}%`;
        childElement.style.minHeight = "150px";
        element.appendChild(childElement);
      }
    }

    return element;
  }

  // Second pass: create elements
  for (let [className, data] of classMap) {
    const wrapper = document.createElement("div");
    wrapper.style.border = "1px solid rgb(221, 221, 221)";
    wrapper.style.borderRadius = "4px";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "10px";

    const label = document.createElement("div");
    label.textContent = `.${className}`;
    wrapper.appendChild(label);

    const element = document.createElement("div");
    element.className = className;
    element.style.minHeight = "150px";

    // Add CSS text checking logic for parent elements
    if (data.rule) {
      const cssText = data.rule.style.cssText.toLowerCase();
      if (cssText.includes("font") || cssText.includes("text")) {
        element.textContent = textContent;
        if (!cssText.includes("background")) {
          element.style.backgroundColor = "lightpink";
        }
      }
    }

    if (data.children.size > 0) {
      for (let [childName, childData] of data.children) {
        const childElement = createElements(childData, childData.className);
        childElement.style.flexBasis = `${100 / data.children.size}%`;
        element.appendChild(childElement);
      }
    }

    wrapper.appendChild(element);
    mainWrapper.appendChild(wrapper);
  }
});
