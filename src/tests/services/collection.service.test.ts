import { getFlattenedValidNodes } from '../../services/collection.service';

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

    const result = getFlattenedValidNodes(testNode);
    const types = result.map((node: BaseNode) => node.type);

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

    const result = getFlattenedValidNodes(testNode);
    const names = result.map((node: BaseNode) => node.name);

    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('_private');
    expect(names).toContain('normal');
    expect(names).toContain('test');
  });
});
