import { generateCombinatorialStyles } from '../../../transformers/variants/generate-combinatorial-styles';
import { input as inputRegular } from './generate-combinatorial-styles-examples/input-regular';
import { output as outputRegular } from './generate-combinatorial-styles-examples/output-regular';
import { input as inputRedMediumNoIconOutlier } from './generate-combinatorial-styles-examples/input-red-medium-no-icon-outlier';
import { output as outputRedMediumNoIconOutlier } from './generate-combinatorial-styles-examples/output-red-medium-no-icon-outlier';
import { input as inputPinkPurple } from './generate-combinatorial-styles-examples/input-pink-purple';
import { output as outputPinkPurple } from './generate-combinatorial-styles-examples/output-pink-purple';
import { input as inputLineHeight } from './generate-combinatorial-styles-examples/input-line-height';
import { output as outputLineHeight } from './generate-combinatorial-styles-examples/output-line-height';
import { input as inputIncludeRoot } from './generate-combinatorial-styles-examples/input-include-root';
import { output as outputIncludeRoot } from './generate-combinatorial-styles-examples/output-include-root';

test('results in regular output', () => {
  expect(generateCombinatorialStyles(inputRegular)).toStrictEqual(outputRegular);
});

test('results in red medium no icon outlier output', () => {
  expect(generateCombinatorialStyles(inputRedMediumNoIconOutlier)).toStrictEqual(
    outputRedMediumNoIconOutlier,
  );
});

test('results in pink purple output', () => {
  expect(generateCombinatorialStyles(inputPinkPurple)).toStrictEqual(outputPinkPurple);
});

test('results in line height output', () => {
  expect(generateCombinatorialStyles(inputLineHeight)).toStrictEqual(outputLineHeight);
});

test('results in include root output', () => {
  expect(generateCombinatorialStyles(inputIncludeRoot)).toStrictEqual(outputIncludeRoot);
});
