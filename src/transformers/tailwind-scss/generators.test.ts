import { generateTailwindGapClass } from "./generators";
import { NonNullableStyleToken } from "../../types";
describe("generateTailwindGapClass", () => {
  const gapToken: NonNullableStyleToken = {
    type: "style",
    name: "gap_gap-24",
    value: "24px",
    rawValue: "24px",
    valueType: "px",
    property: "gap",
    path: ["gap", "gap-24"],
    metadata: {
      figmaId: "150:63",
    },
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
