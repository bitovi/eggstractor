// // // theme: red-theme, green-theme, yellow-theme, (pink-theme, purple-theme)

// // // size: small, medium, large

// // // icon: true, false

export const input = [
  {
    variants: {
      theme: "red-theme",
      size: "small",
      icon: "false",
    },
    css: {
      color: "red",
      height: "10px",
    },
  },
  {
    // variants: {
    //   theme: "red-theme",
    //   size: "medium",
    //   icon: "false",
    // },
    // css: {
    //   color: "red",
    //   height: "20px",
    // },
    variants: {
      theme: "red-theme",
      size: "medium",
      icon: "false",
    },
    css: {
      color: "red",
      height: "40px",
    },
  },
  {
    variants: {
      theme: "red-theme",
      size: "large",
      icon: "false",
    },
    css: {
      color: "red",
      height: "30px",
    },
  },

  {
    variants: {
      theme: "red-theme",
      size: "small",
      icon: "true",
    },
    css: {
      color: "red",
      height: "8px",
    },
  },
  {
    variants: {
      theme: "red-theme",
      size: "medium",
      icon: "true",
    },
    css: {
      color: "red",
      height: "16px",
    },
  },
  {
    variants: {
      theme: "red-theme",
      size: "large",
      icon: "true",
    },
    css: {
      color: "red",
      height: "32px",
    },
  },

  // Green

  {
    variants: {
      theme: "green-theme",
      size: "small",
      icon: "false",
    },
    css: {
      color: "green",
      height: "10px",
    },
  },
  {
    variants: {
      theme: "green-theme",
      size: "medium",
      icon: "false",
    },
    css: {
      color: "green",
      height: "20px",
    },
  },
  {
    variants: {
      theme: "green-theme",
      size: "large",
      icon: "false",
    },
    css: {
      color: "green",
      height: "30px",
    },
  },

  {
    variants: {
      theme: "green-theme",
      size: "small",
      icon: "true",
    },
    css: {
      color: "green",
      height: "8px",
    },
  },
  {
    variants: {
      theme: "green-theme",
      size: "medium",
      icon: "true",
    },
    css: {
      color: "green",
      height: "16px",
    },
  },
  {
    variants: {
      theme: "green-theme",
      size: "large",
      icon: "true",
    },
    css: {
      color: "green",
      height: "32px",
    },
  },

  // Yellow

  {
    variants: {
      theme: "yellow-theme",
      size: "small",
      icon: "false",
    },
    css: {
      color: "yellow",
      height: "10px",
    },
  },
  {
    variants: {
      theme: "yellow-theme",
      size: "medium",
      icon: "false",
    },
    css: {
      color: "yellow",
      height: "20px",
    },
  },
  {
    variants: {
      theme: "yellow-theme",
      size: "large",
      icon: "false",
    },
    css: {
      color: "yellow",
      height: "30px",
    },
  },

  {
    variants: {
      theme: "yellow-theme",
      size: "small",
      icon: "true",
    },
    css: {
      color: "yellow",
      height: "8px",
    },
  },
  {
    variants: {
      theme: "yellow-theme",
      size: "medium",
      icon: "true",
    },
    css: {
      color: "yellow",
      height: "16px",
    },
  },
  {
    variants: {
      theme: "yellow-theme",
      size: "large",
      icon: "true",
    },
    css: {
      color: "yellow",
      height: "32px",
    },
  },

  // // Special purple
  {
    variants: {
      theme: "purple-theme",
      size: "small",
      icon: "true",
    },
    css: {
      color: "purple",
      height: "32px",
    },
  },

  // Special pink
  {
    variants: {
      theme: "pink-theme",
      size: "medium",
      icon: "true",
    },
    css: {
      color: "pink",
      height: "8px",
    },
  },
].map((instance) => ({
  ...instance,
  css: { ...instance.css, "line-height": getLineHeight(instance.css.height) },
}));
// .map((instance, i) => ({...instance, variants: {...instance.variants, even: `${!(i % 2)}`}}))

// function getLineHeight(height: string): string {
//     const value = +height.split('px')[0];
//     return `${value * 1.5}px`;
// }

function getLineHeight(height: string): string {
  const value = +height.split("px")[0];

  if (value >= 40) {
    return "20px";
  }

  if (value >= 30) {
    return "15px";
  }

  if (value >= 20) {
    return "10px";
  }

  if (value >= 10) {
    return "5px";
  }

  return "1px";
}
