import { generateStyles, type Input } from "../../transformers/variants";
import { input as inputRegular } from "./samples/input-regular";
import { output as outputRegular } from "./samples/output-regular";
import { input as inputRedMediumNoIconOutlier } from "./samples/input-red-medium-no-icon-outlier";
import { output as outputRedMediumNoIconOutlier } from "./samples/output-red-medium-no-icon-outlier";
import { input as inputPinkPurple } from "./samples/input-pink-purple";
import { output as outputPinkPurple } from "./samples/output-pink-purple";
import { input as inputLineHeight } from "./samples/input-line-height";
import { output as outputLineHeight } from "./samples/output-line-height";
import { input as inputIncludeRoot } from "./samples/input-include-root";
import { output as outputIncludeRoot } from "./samples/output-include-root";

test("results in regular output", () => {
  expect(generateStyles(inputRegular)).toStrictEqual(outputRegular);
});

test("results in red medium no icon outlier output", () => {
  expect(generateStyles(inputRedMediumNoIconOutlier)).toStrictEqual(
    outputRedMediumNoIconOutlier,
  );
});

test("results in pink purple output", () => {
  expect(generateStyles(inputPinkPurple)).toStrictEqual(outputPinkPurple);
});

test("results in line height output", () => {
  expect(generateStyles(inputLineHeight)).toStrictEqual(outputLineHeight);
});

test("results in include root output", () => {
  expect(generateStyles(inputIncludeRoot as Input)).toStrictEqual(outputIncludeRoot);
});
