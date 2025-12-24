import { BaseToken } from '../../../types';
import { createNamingContext, NamingContextConfig } from '../../../utils';

describe('createNamingContext', () => {
  describe('with default context', () => {
    let namingContext: ReturnType<typeof createNamingContext>;

    beforeEach(() => {
      namingContext = createNamingContext();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('createName', () => {
      const path: BaseToken['path'] = [
        { name: 'button page', type: 'SECTION' } as SceneNode,
        { name: 'button', type: 'COMPONENT_SET' } as SceneNode,
      ];
      it('should handle ROOT variant', () => {
        const result = namingContext.createName(path);
        expect(result).toBe('button-page-button');
      });

      it('should extract just the value from property-value pairs', () => {
        const result = namingContext.createName(path, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-large');
      });

      it('should handle multiple variants', () => {
        const result = namingContext.createName(path, {}, { Size: 'Large', Theme: 'Primary' });
        expect(result).toBe('button-page-button-large-primary');
      });

      it('should handle multi-word values', () => {
        const result = namingContext.createName(path, {}, { 'Icon Only': 'True' });
        expect(result).toBe('button-page-button-true');
      });

      it('should convert "Multi Bold" to "multi-bold"', () => {
        const result = namingContext.createName(path, {}, { Weight: 'Multi Bold' });
        expect(result).toBe('button-page-button-multi-bold');
      });

      it('should handle property name conflicts with prefixing', () => {
        const conflicts = { default: ['size', 'theme', 'sentiment'] };

        const result = namingContext.createName(path, conflicts, {
          Size: 'Default',
          Theme: 'Primary',
          State: 'Hover',
        });
        expect(result).toBe('button-page-button-size_default-theme_primary-hover');
      });

      it('should filter out COMPONENT type from path', () => {
        const componentPath: BaseToken['path'] = [
          ...path,
          {
            name: 'large--and--link--and--default',
            type: 'COMPONENT',
          } as SceneNode,
          { name: 'text', type: 'TEXT' } as SceneNode,
        ];
        const result = namingContext.createName(componentPath, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-text-large');
      });

      it('should handle empty variant combination', () => {
        const result = namingContext.createName(path);
        expect(result).toBe('button-page-button');
      });

      it('should handle spaces in path names', () => {
        const pathSet: BaseToken['path'] = [
          { name: 'button page', type: 'SECTION' } as SceneNode,
          { name: 'button set', type: 'COMPONENT_SET' } as SceneNode,
        ];
        const result = namingContext.createName(pathSet, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-set-large');
      });

      it('should convert everything to lowercase', () => {
        const pathUpperCase: BaseToken['path'] = [
          { name: 'BUTTON PAGE', type: 'SECTION' } as SceneNode,
          { name: 'Button', type: 'COMPONENT_SET' } as SceneNode,
        ];
        const result = namingContext.createName(pathUpperCase, {}, { Size: 'LARGE' });
        expect(result).toBe('button-page-button-large');
      });

      it('should handle boolean values with special rules', () => {
        const result = namingContext.createName(
          path,
          {},
          { Disabled: 'True', Required: 'False', Active: 'Yes', Hidden: 'No' },
        );
        // true/yes = no prefix, false/no = always prefixed
        expect(result).toBe('button-page-button-true-required_false-yes-hidden_no');
      });

      describe('special character handling', () => {
        it('should remove parentheses from variant values', () => {
          const result = namingContext.createName(path, {}, { Size: '(md)' });
          expect(result).toBe('button-page-button-md');
        });

        it('should handle parentheses with word default', () => {
          const result = namingContext.createName(path, {}, { Type: 'blue-(default)' });
          expect(result).toBe('button-page-button-blue-default');
        });

        it('should remove plus signs from variant values', () => {
          const result = namingContext.createName(
            path,
            {},
            {
              Type: 'primary-+-2-secondary-+-link',
            },
          );
          expect(result).toBe('button-page-button-primary-2-secondary-link');
        });

        it('should remove ampersands from variant values', () => {
          const result = namingContext.createName(path, {}, { Type: '-&-language' });
          expect(result).toBe('button-page-button-language');
        });

        it('should handle multiple special characters together', () => {
          const result = namingContext.createName(
            path,
            {},
            {
              Size: '(lg)',
              Type: 'primary-+-secondary',
              State: 'active-&-hover',
            },
          );
          expect(result).toBe('button-page-button-lg-primary-secondary-active-hover');
        });

        it('should remove parentheses from property names', () => {
          const result = namingContext.createName(path, {}, { 'Size(px)': 'large' });
          expect(result).toBe('button-page-button-large');
        });

        it('should collapse consecutive hyphens after removing special chars', () => {
          const result = namingContext.createName(path, {}, { Type: 'a-+-+-b' });
          expect(result).toBe('button-page-button-a-b');
        });

        it('should remove leading/trailing hyphens after special char removal', () => {
          const result = namingContext.createName(path, {}, { Type: '(&test&)' });
          expect(result).toBe('button-page-button-test');
        });
      });
    });
  });
  describe('with context that has page disabled', () => {
    const testContextConfig: NamingContextConfig = {
      env: 'tailwind-v4',
      includePageInPath: false,
      delimiters: {
        pathSeparator: '/',
        afterComponentName: '.',
        variantEqualSign: '_',
        betweenVariants: '---',
      },
      duplicate: (name, count) => `${name}${count}`,
    };

    let namingContext: ReturnType<typeof createNamingContext>;

    beforeEach(() => {
      namingContext = createNamingContext(testContextConfig);
    });

    describe('createName', () => {
      it('should use all custom delimiters and exclude page from path', () => {
        const path: BaseToken['path'] = [
          { name: 'button page', type: 'SECTION' } as SceneNode,
          { name: 'button', type: 'COMPONENT_SET' } as SceneNode,
          { name: 'text', type: 'TEXT' } as SceneNode,
        ];
        const conflicts = { default: ['size'] };
        const result = namingContext.createName(path, conflicts, {
          Size: 'Default',
          Theme: 'Primary',
          State: 'Hover',
        });

        expect(result).toBe('button/text.size_default---primary---hover');
      });
    });
  });
});
