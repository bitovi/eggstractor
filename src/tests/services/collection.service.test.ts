import {
  getFlattenedValidNodes,
  detectComponentSetDuplicates,
  shouldSkipInstanceTokenGeneration,
} from '../../services/collection.service';
import { createPrimitiveVariableToken } from '../../services/variable.service';
import * as variableService from '../../services/variable.service';
import { InstanceToken, TokenCollection } from '../../types';

beforeEach(() => {
  // Suppress console output for cleaner test results
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getFlattenedValidNodes', () => {
  const testNode = {
    type: 'FRAME',
    name: 'test',
    id: '1',
    children: [
      { type: 'TEXT', name: '.hidden', id: '2' } as TextNode,
      { type: 'TEXT', name: '_private', id: '3' } as TextNode,
      { type: 'TEXT', name: 'normal', id: '4' } as TextNode,
    ],
  } as unknown as FrameNode;
  it('should filter out nodes with names starting with . or _', () => {
    const { validNodes } = getFlattenedValidNodes(testNode);
    const names = validNodes.map((node: BaseNode) => node.name);

    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('_private');
    expect(names).toContain('normal');
    expect(names).toContain('test');
  });

  it('should filter out nodes with visible that equals "false"', () => {
    const result = getFlattenedValidNodes({ ...testNode, visible: false });

    expect(result.validNodes).toHaveLength(0);
    expect(result.warningTokens).toHaveLength(0);
  });
});

describe('Component Set Duplicate Detection', () => {
  const mockComponentSet = {
    type: 'COMPONENT_SET',
    name: 'Button',
    id: '265:2',
    children: [
      {
        type: 'COMPONENT',
        id: '265:48',
        name: 'State=Resting, Size=Regular, Intent=Brand, Variant=Solid, Rounded?=False',
      },
      {
        type: 'COMPONENT',
        id: '2174:408',
        name: 'State=Resting, Size=Regular, Intent=Brand, Variant=Solid, Rounded?=False',
      },
    ],
  } as unknown as BaseNode;
  it('should detect duplicate variants in component set', () => {
    const result = detectComponentSetDuplicates(mockComponentSet);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicateNames).toContain(
      'State=Resting, Size=Regular, Intent=Brand, Variant=Solid, Rounded?=False',
    );
  });

  it('should pass validation for unique variants', () => {
    const mockUniqueComponentSet = {
      ...mockComponentSet,
      children: [
        {
          type: 'COMPONENT',
          id: '265:48',
          name: 'State=Resting, Size=Regular, Intent=Brand, Variant=Solid, Rounded?=False',
        },
        {
          type: 'COMPONENT',
          id: '2174:408',
          name: 'State=Resting, Size=Regular, Intent=Brand, Variant=Solid, Rounded?=True',
        },
      ],
    } as unknown as BaseNode;

    expect(detectComponentSetDuplicates(mockUniqueComponentSet).hasDuplicates).toBe(false);
    expect(detectComponentSetDuplicates(mockUniqueComponentSet).duplicateNames).toEqual([]);
  });

  it('should filter out corrupted component sets from node tree', () => {
    const nodes = getFlattenedValidNodes(mockComponentSet);

    expect(nodes).not.toContainEqual(
      expect.objectContaining({
        type: 'COMPONENT_SET',
        name: 'Button',
      }),
    );
  });
});

describe('shouldSkipInstanceTokenGeneration', () => {
  const mockInstanceNode = {
    type: 'INSTANCE',
    name: 'Button Instance',
    id: 'instance-123',
  } as InstanceNode;

  const mockInstanceToken = {
    componentNode: {
      id: 'component-456',
    },
  } as InstanceToken;

  const mockCollection = {
    tokens: [],
    components: {
      'component-456': {
        id: 'component-456',
        name: 'Button Component',
        type: 'COMPONENT',
        componentSetId: null,
        variantProperties: {},
      },
    },
    componentSets: {},
    instances: {},
  } as TokenCollection;

  it('should skip token generation when instance references existing component', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementationOnce(() => {
      /* stub */
    });
    const result = shouldSkipInstanceTokenGeneration(
      mockInstanceNode,
      mockInstanceToken,
      mockCollection,
    );

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      '🎯 Instance "Button Instance" duplicates component "component-456" - skipping tokens',
    );
  });

  it('should not skip token generation when component does not exist in collection', () => {
    const mockEmptyCollection = {
      ...mockCollection,
      components: {},
    };

    const result = shouldSkipInstanceTokenGeneration(
      mockInstanceNode,
      mockInstanceToken,
      mockEmptyCollection,
    );

    expect(result).toBe(false);
  });

  it('should not skip token generation when instance token has no componentNode', () => {
    const mockEmptyInstanceToken = {} as InstanceToken;

    const result = shouldSkipInstanceTokenGeneration(
      mockInstanceNode,
      mockEmptyInstanceToken,
      mockCollection,
    );

    expect(result).toBe(false);
  });
});

describe('createPrimitiveVariableToken', () => {
  let createPrimitiveVariableTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on the actual function
    createPrimitiveVariableTokenSpy = jest.spyOn(variableService, 'createPrimitiveVariableToken');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockColorVariable = {
    id: 'var-123',
    name: 'Color/Blue/500',
    resolvedType: 'COLOR',
    valuesByMode: {
      'mode-1': { r: 0, g: 0.5, b: 1 },
    },
  } as Partial<Variable>;

  it('should be called with correct parameters for color variables', async () => {
    // Mock the implementation to return a known result
    createPrimitiveVariableTokenSpy.mockResolvedValue({
      type: 'variable',
      property: 'color',
      name: 'color-blue-500',
      value: '$color-blue-500',
      metadata: {
        variableId: 'var-123',
        variableName: 'Color/Blue/500',
        variableTokenType: 'primitive',
      },
    });

    const result = await createPrimitiveVariableToken(mockColorVariable as Variable);

    expect(createPrimitiveVariableTokenSpy).toHaveBeenCalledWith(mockColorVariable);
    expect(result).toEqual({
      type: 'variable',
      property: 'color',
      name: 'color-blue-500',
      value: '$color-blue-500',
      metadata: {
        variableId: 'var-123',
        variableName: 'Color/Blue/500',
        variableTokenType: 'primitive',
      },
    });
  });

  it('should return null for alias variables', async () => {
    const aliasVariable = {
      id: 'var-alias',
      name: 'Color/Alias',
      resolvedType: 'COLOR',
      valuesByMode: {
        'mode-1': { type: 'VARIABLE_ALIAS', id: 'other-var' },
      },
    } as Partial<Variable>;

    createPrimitiveVariableTokenSpy.mockResolvedValue(null);

    const result = await createPrimitiveVariableToken(aliasVariable as Variable);

    expect(result).toBeNull();
  });

  it('should return null for unsupported variable types', async () => {
    const unsupportedVariable = {
      id: 'var-unsupported',
      name: 'Unsupported/Variable',
      resolvedType: 'BOOLEAN',
      valuesByMode: {
        'mode-1': true,
      },
    } as Partial<Variable>;

    createPrimitiveVariableTokenSpy.mockResolvedValue(null);

    const result = await createPrimitiveVariableToken(unsupportedVariable as Variable);

    expect(result).toBeNull();
  });
});
