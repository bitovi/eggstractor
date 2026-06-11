import { collectSemanticColorVariables } from '../../services/variable.service';
import { ModeVariableToken, TokenCollection } from '../../types';

/**
 * Regression test for the "dataviz" edge case: a variable that is a plain literal in the
 * default mode but an alias in another mode (e.g. --color-dataviz-category-02 is #ffffff in
 * "ascend" but aliases a primitive in "nha-new").
 *
 * Such tokens used to fall through both collectors - the primitive collector skips anything
 * that aliases in any mode, and the semantic collector required an alias in the DEFAULT mode.
 * Approach 1 (CSS only) keeps them: collect if it aliases in ANY mode, emit the literal where
 * it's literal and the var() ref where it's an alias.
 */

const MODE_ASCEND = 'mode-ascend';
const MODE_NHA = 'mode-nha';

const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const NHA_PRIMARY = { r: 0.1, g: 0.18, b: 0.31, a: 1 };

const datavizVar = {
  id: 'var-dataviz-02',
  name: 'color/dataviz/category-02',
  resolvedType: 'COLOR',
  valuesByMode: {
    // literal in the default (first) mode...
    [MODE_ASCEND]: WHITE,
    // ...alias in another mode
    [MODE_NHA]: { type: 'VARIABLE_ALIAS', id: 'var-primitive-nha-primary' },
  },
} as unknown as Variable;

const primitiveVar = {
  id: 'var-primitive-nha-primary',
  name: 'primitive/nha-new/color-primary',
  resolvedType: 'COLOR',
  valuesByMode: {
    [MODE_ASCEND]: NHA_PRIMARY,
    [MODE_NHA]: NHA_PRIMARY,
  },
} as unknown as Variable;

const variablesById: Record<string, Variable> = {
  'var-dataviz-02': datavizVar,
  'var-primitive-nha-primary': primitiveVar,
};

const mockCollection = {
  id: 'collection-brand',
  name: 'Brand',
  modes: [
    { modeId: MODE_ASCEND, name: 'ascend' },
    { modeId: MODE_NHA, name: 'nha-new' },
  ],
  variableIds: ['var-dataviz-02'],
} as unknown as VariableCollection;

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {
    /* stub */
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {
    /* stub */
  });

  global.figma = {
    variables: {
      getLocalVariableCollectionsAsync: vi.fn().mockResolvedValue([mockCollection]),
      getVariableByIdAsync: vi.fn((id: string) => Promise.resolve(variablesById[id] ?? null)),
    },
  } as unknown as PluginAPI;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const newCollection = (): TokenCollection => ({
  tokens: [],
  components: {},
  componentSets: {},
  instances: {},
});

const findDataviz = (collection: TokenCollection) =>
  collection.tokens.find(
    (t): t is ModeVariableToken => t.type === 'variable' && t.name === 'color-dataviz-category-02',
  );

describe('collectSemanticColorVariables - mixed literal/alias modes (dataviz edge case)', () => {
  it('CSS (includeAllSemanticTypes) captures a token that is literal in default mode, alias elsewhere', async () => {
    const collection = newCollection();
    await collectSemanticColorVariables(collection, () => undefined, {
      includeAllSemanticTypes: true,
    });

    const token = findDataviz(collection);
    expect(token).toBeDefined();

    // Default mode is a literal -> no default primitive ref, so :root emits the literal.
    expect(token?.primitiveRef).toBeUndefined();

    // The alias mode references the primitive; the literal mode does not.
    expect(token?.modePrimitiveRefs?.[MODE_NHA]).toBe('primitive-nha-new-color-primary');
    expect(token?.modePrimitiveRefs?.[MODE_ASCEND]).toBeUndefined();

    // The literal mode keeps its own literal value.
    expect(token?.modeValues?.[MODE_ASCEND]).toBe('#ffffff');
  });

  it('legacy (SCSS/Tailwind) still drops the token because its default mode is a literal', async () => {
    const collection = newCollection();
    await collectSemanticColorVariables(collection, () => undefined, {
      includeAllSemanticTypes: false,
    });

    expect(findDataviz(collection)).toBeUndefined();
  });
});
