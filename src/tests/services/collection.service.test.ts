import {
  getFlattenedValidNodes,
  detectComponentSetDuplicates,
} from '../../services/collection.service';

describe('getFlattenedValidNodes', () => {
  it('should filter out VECTOR and INSTANCE nodes', () => {
    const testNode = {
      type: 'FRAME',
      name: 'test',
      id: '1',
      children: [
        { type: 'VECTOR', name: 'vector1', id: '2' } as VectorNode,
        { type: 'TEXT', name: 'text1', id: '3' } as TextNode,
        { type: 'INSTANCE', name: 'instance1', id: '4' } as InstanceNode,
        { type: 'RECTANGLE', name: 'rect1', id: '5' } as RectangleNode,
      ],
    } as unknown as FrameNode;

    const { validNodes } = getFlattenedValidNodes(testNode);
    const types = validNodes.map((node: BaseNode) => node.type);

    expect(types).not.toContain('VECTOR');
    expect(types).toContain('INSTANCE');
    expect(types).toContain('FRAME');
    expect(types).toContain('TEXT');
    expect(types).toContain('RECTANGLE');
  });

  it('should filter out nodes with names starting with . or _', () => {
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

    const { validNodes } = getFlattenedValidNodes(testNode);
    const names = validNodes.map((node: BaseNode) => node.name);

    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('_private');
    expect(names).toContain('normal');
    expect(names).toContain('test');
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
