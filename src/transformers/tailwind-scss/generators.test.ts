import {
  generateTailwindGapClass,
  normalizeFourSides,
  normalizeBorderRadius,
  normalizeTailwindToken,
  normalizeTwoSides,
  generateTailwindBorderClass,
  generateTailwindBorderRadiusClass,
  generateTailwindFontFamilyOutput,
  generateTailwindPaddingClass,
} from "./generators";
import { NonNullableStyleToken } from "../../types";

const basicToken: NonNullableStyleToken = {
  type: "style",
  name: "basic",
  value: "notused 1px",
  rawValue: "1px",
  valueType: "px",
  property: "blank",
  path: ["basic", "gap"],
  metadata: {
    figmaId: "notapplicable",
  },
};

describe("normalizeTailwindToken", () => {
  const whateverRecord: Record<string, string> = {
    "1px": "whatever-1",
    "this should give DEFAULT": "DEFAULT",
  };

  it("should return correct property for given key", () => {
    const result = normalizeTailwindToken(whateverRecord, basicToken.rawValue);
    expect(result).toBe("whatever-1");
  });

  it("should return return responsive utility foe given key if no match found", () => {
    const result = normalizeTailwindToken(whateverRecord, "not there");
    expect(result).toBe("[not there]");
  });

  it("should return an empty string if key is 'DEFAULT'", () => {
    const result = normalizeTailwindToken(
      whateverRecord,
      "this should give DEFAULT"
    );
    expect(result).toBe("");
  });
});

describe("normalizeTwoSides", () => {
  it("should return a two string array with the same value if given a string with one value", () => {
    const result = normalizeTwoSides("10px");
    expect(result).toEqual(["10px", "10px"]);
  });
  it("should return a two string array a string with two values separated by a space", () => {
    const result = normalizeTwoSides("10px 20px");
    expect(result).toEqual(["10px", "20px"]);
  });
});

describe("normalizeFourSides", () => {
  it("should return a four string array with the same value if given a string with one value", () => {
    const result = normalizeFourSides("10px");
    expect(result).toEqual(["10px", "10px", "10px", "10px"]);
  });
  it("should return a four string array with two matching values if given a string with two values separated by a space", () => {
    const result = normalizeFourSides("10px 20px");
    expect(result).toEqual(["10px", "20px", "10px", "20px"]);
  });

  it("should return a four string array with if given a string with three values separated by a space", () => {
    const result = normalizeFourSides("10px 20px 30px");
    expect(result).toEqual(["10px", "20px", "30px", "20px"]);
  });
  it("should return a four string array if given a string with four values separated by a space", () => {
    const result = normalizeFourSides("10px 20px 30px 40px");
    expect(result).toEqual(["10px", "20px", "30px", "40px"]);
  });
});

describe("normalizeBorderRadius", () => {
  it("should return a four string array with the same value if given a string with one value", () => {
    const result = normalizeBorderRadius("10px");
    expect(result).toEqual(["10px", "10px", "10px", "10px"]);
  });

  it("should return a four string array with values sorted in a diagonal layout for border radius when given a string with two values separated by space", () => {
    const result = normalizeBorderRadius("10px 20px");
    expect(result).toEqual(["10px", "20px", "10px", "20px"]);
  });

  it("should return a four string array with if given a string with three values separated by a space", () => {
    const result = normalizeBorderRadius("10px 20px 30px");
    expect(result).toEqual(["10px", "20px", "30px", "20px"]);
  });
  it("should return a four string array if given a string with four values separated by a space", () => {
    const result = normalizeBorderRadius("10px 20px 30px 40px");
    expect(result).toEqual(["10px", "20px", "30px", "40px"]);
  });
});

describe("generateTailwindPaddingClass", () => {
  const paddingToken = {
    ...basicToken,
    property: "padding",
    rawValue: "4px",
  };

  it("should return tailwind properties for one padding element", () => {
    const result = generateTailwindPaddingClass(paddingToken);
    expect(result).toBe("pt-1 pr-1 pb-1 pl-1");
  });
  it("should return tailwind properties for four padding element", () => {
    const additionalPaddingToken = {
      ...paddingToken,
      rawValue: "5px 10px 4px 20px",
    };
    const result = generateTailwindPaddingClass(additionalPaddingToken);
    expect(result).toBe("pt-[5px] pr-2.5 pb-1 pl-5");
  });
});

describe("generateTailwindBorderClass", () => {
  const borderToken = {
    ...basicToken,
    property: "border",
    rawValue: "2px solid #0daeff",
  };
  it("should return tailwind utilities for border width, style, and color", () => {
    const result = generateTailwindBorderClass(borderToken);
    expect(result).toBe("border-2 border-solid border-[#0daeff]");
  });

  it("should return 'border' tailwind utility if key given default value", () => {
    const borderDefaultToken = {
      ...borderToken,
      rawValue: "1px solid #0daeff", // "1px" : "DEFAULT" in borderWidths
    };
    const result = generateTailwindBorderClass(borderDefaultToken);
    expect(result).toBe("border border-solid border-[#0daeff]");
  });
  it("should return tailwind utilities for style and color properly if no width provided", () => {
    const borderTokenNoWidth = {
      ...borderToken,
      rawValue: "solid #0daeff",
    };
    const result = generateTailwindBorderClass(borderTokenNoWidth);
    expect(result).toBe("border-solid border-[#0daeff]");
  });

  it("should return tailwind utilities for width and color properly if no style provided", () => {
    const borderTokenNoColor = {
      ...borderToken,
      rawValue: "2px #0daeff",
    };
    const result = generateTailwindBorderClass(borderTokenNoColor);
    expect(result).toBe("border-2 border-[#0daeff]");
  });
});

describe("generateTailwindBorderRadiusClass", () => {
  const borderRadiusToken = {
    ...basicToken,
    property: "border-radius",
    rawValue: "20px",
  };
  it("should return tailwind utilities for border radius when given one property", () => {
    const result = generateTailwindBorderRadiusClass(borderRadiusToken);
    expect(result).toBe(
      "rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px]"
    );
  });

  it("should return tailwind utilities for border radius when given one property", () => {
    const defaultBorderRadiusToken = {
      ...basicToken,
      property: "border-radius",
      rawValue: "4px", // "1px" : "DEFAULT" in borderRadius
    };
    const result = generateTailwindBorderRadiusClass(defaultBorderRadiusToken);
    expect(result).toBe("rounded-tl rounded-tr rounded-br rounded-bl");
  });

  it("should return tailwind utilities for border radius when given two properties", () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: "5px 10px",
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe(
      "rounded-tl-[5px] rounded-tr-[10px] rounded-br-[5px] rounded-bl-[10px]"
    );
  });

  it("should return tailwind utilities for border radius when given three properties", () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: "5px 10px 15px",
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe(
      "rounded-tl-[5px] rounded-tr-[10px] rounded-br-[15px] rounded-bl-[10px]"
    );
  });
  it("should return tailwind utilities for border radius when given four properties", () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: "5px 10px 15px 20px",
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe(
      "rounded-tl-[5px] rounded-tr-[10px] rounded-br-[15px] rounded-bl-[20px]"
    );
  });
});
describe("generateTailwindFontFamilyOutput", () => {
  const fontToken = {
    ...basicToken,
    property: "font",
    rawValue: "sans",
  };
  it("should return tailwind properties for a font family existing element", () => {
    const result = generateTailwindFontFamilyOutput(fontToken);
    expect(result).toBe("font-sans");
  });
  it("should return an arbitrary value for font family if it's not found", () => {
    const notFoundFontToken = {
      ...fontToken,
      rawValue: "arial",
    };
    const result = generateTailwindFontFamilyOutput(notFoundFontToken);
    expect(result).toBe(`font-[${notFoundFontToken.rawValue}]`);
  });
});

describe("generateTailwindGapClass", () => {
  const gapToken: NonNullableStyleToken = {
    ...basicToken,
    rawValue: "24px",
    property: "gap",
  };
  it("should return correct tailwind shorthand for single gap value", () => {
    const result = generateTailwindGapClass(gapToken);
    expect(result).toBe("gap-x-6 gap-y-6");
  });

  it("should return correct tailwind shorthand for two gap values (x and y)", () => {
    const twoGapValuesToken = { ...gapToken, rawValue: "24px 16px" };
    const result = generateTailwindGapClass(twoGapValuesToken);
    expect(result).toBe("gap-x-6 gap-y-4");
  });
});
