import { describe, it, expect, vi } from 'vitest';
import { shadowProcessors } from '../../processors/shadow.processor';
import { VariableToken } from '../../types';

describe('Shadow Processor - Effect Style Variables', () => {
  it('should use variable reference when shadow effect is bound to effect style', async () => {
    // Create a mock effect style variable token
    const shadowVariable: VariableToken = {
      type: 'variable',
      name: 'shadow-md',
      value: 'shadow-md',
      rawValue: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      property: 'box-shadow',
      path: [],
      valueType: null,
      metadata: {
        figmaId: 'effect-style-1',
        variableName: 'Shadow MD',
        variableTokenType: 'primitive',
      },
    };

    const variableTokenMapByProperty = new Map<string, VariableToken>();
    variableTokenMapByProperty.set('box-shadow', shadowVariable);

    // Create a mock node with shadow effects
    const mockNode = {
      effects: [
        {
          type: 'DROP_SHADOW',
          visible: true,
          radius: 8,
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 4 },
          spread: 0,
        },
      ],
    } as unknown as SceneNode;

    const processor = shadowProcessors[0];
    const result = await processor.process(variableTokenMapByProperty, mockNode);

    expect(result).not.toBeNull();
    expect(result?.rawValue).toBe('var(--shadow-md)');
  });

  it('should combine inside borders with effect style variable', async () => {
    // Create mock border color variable
    const borderColorVariable: VariableToken = {
      type: 'variable',
      name: 'overlay-border-neutral-tint',
      value: 'overlay-border-neutral-tint',
      rawValue: '#e0e0e0',
      property: 'color',
      path: [],
      valueType: null,
      metadata: {
        variableId: 'var-1',
        variableName: 'Overlay Border Neutral Tint',
        variableTokenType: 'semantic',
      },
    };

    // Create mock shadow effect style variable
    const shadowVariable: VariableToken = {
      type: 'variable',
      name: 'shadow-md',
      value: 'shadow-md',
      rawValue: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      property: 'box-shadow',
      path: [],
      valueType: null,
      metadata: {
        figmaId: 'effect-style-1',
        variableName: 'Shadow MD',
        variableTokenType: 'primitive',
      },
    };

    const variableTokenMapByProperty = new Map<string, VariableToken>();
    variableTokenMapByProperty.set('strokes', borderColorVariable);
    variableTokenMapByProperty.set('box-shadow', shadowVariable);

    // Create a mock node with INSIDE stroke and shadow effects
    const mockNode = {
      strokeAlign: 'INSIDE',
      strokes: [{ type: 'SOLID', color: { r: 0.88, g: 0.88, b: 0.88, a: 1 } }],
      strokeWeight: 1,
      strokeTopWeight: 1,
      strokeRightWeight: 1,
      strokeBottomWeight: 1,
      strokeLeftWeight: 1,
      effects: [
        {
          type: 'DROP_SHADOW',
          visible: true,
          radius: 8,
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 4 },
          spread: 0,
        },
      ],
    } as unknown as SceneNode;

    const processor = shadowProcessors[0];
    const result = await processor.process(variableTokenMapByProperty, mockNode);

    expect(result).not.toBeNull();
    // Should contain both inside border shadows and the effect style variable
    expect(result?.rawValue).toContain('inset');
    expect(result?.rawValue).toContain('#e0e0e0'); // Border color as hex
    expect(result?.rawValue).toContain('var(--shadow-md)'); // Effect style as variable
  });

  it('should fall back to converting effects when no effect style variable is bound', async () => {
    const variableTokenMapByProperty = new Map<string, VariableToken>();

    // Create a mock node with shadow effects but no bound variable
    const mockNode = {
      effects: [
        {
          type: 'DROP_SHADOW',
          visible: true,
          radius: 8,
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 4 },
          spread: 0,
        },
      ],
    } as unknown as SceneNode;

    const processor = shadowProcessors[0];
    const result = await processor.process(variableTokenMapByProperty, mockNode);

    expect(result).not.toBeNull();
    // Should contain the converted shadow (not a variable reference)
    expect(result?.rawValue).toContain('rgba');
    expect(result?.rawValue).not.toContain('var(--');
  });
});
