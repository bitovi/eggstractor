import { createNamingConvention } from './createNamingConvention';
import { NamingContext } from '../utils';

describe('createNamingConvention', () => {
  describe('with default context', () => {
    let namingFunctions: ReturnType<typeof createNamingConvention>;

    beforeEach(() => {
      namingFunctions = createNamingConvention();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('createName', () => {
      it('should handle ROOT variant', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'ROOT');
        expect(result).toBe('button-page-button');
      });

      it('should extract just the value from property-value pairs', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size=Large');
        expect(result).toBe('button-page-button-large');
      });

      it('should handle multiple variants', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size=Large--Theme=Primary');
        expect(result).toBe('button-page-button-large-primary');
      });

      it('should handle multi-word values', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Icon Only=True');
        expect(result).toBe('button-page-button-true');
      });

      it('should convert "Icon Only" to "icon-only"', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Icon Only=Icon Only');
        expect(result).toBe('button-page-button-icon-only');
      });

      it('should handle property name conflicts with prefixing', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const conflicts = { default: ['size', 'theme', 'sentiment'] };

        const result = namingFunctions.createName(
          path,
          'Size=Default--Theme=Primary--State=Hover',
          conflicts,
        );
        expect(result).toBe('button-page-button-size_default-theme_primary-hover');
      });

      it('should filter out COMPONENT type from path', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
          { name: 'large--and--link--and--default', type: 'COMPONENT' },
          { name: 'text', type: 'TEXT' },
        ];
        const result = namingFunctions.createName(path, 'Size=Large');
        expect(result).toBe('button-page-button-text-large');
      });

      it('should handle empty variant combination', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, '');
        expect(result).toBe('button-page-button'); // Now this will work!
      });

      it('should handle variants without properties (legacy format)', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'primary');
        expect(result).toBe('button-page-button-primary');
      });

      it('should handle spaces in path names', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button set', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size=Large');
        expect(result).toBe('button-page-button-set-large');
      });

      it('should convert everything to lowercase', () => {
        const path = [
          { name: 'BUTTON PAGE', type: 'PAGE' },
          { name: 'Button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size=LARGE');
        expect(result).toBe('button-page-button-large');
      });

      it('should handle boolean values with special rules', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(
          path,
          'Disabled=True--Required=False--Active=Yes--Hidden=No',
        );
        // true/yes = no prefix, false/no = always prefixed
        expect(result).toBe('button-page-button-true-required_false-yes-hidden_no');
      });

      describe('for templated input', () => {
        it('should handle --and-- format', () => {
          const path = [
            { name: 'button page', type: 'PAGE' },
            { name: 'button', type: 'COMPONENT_SET' },
          ];
          const result = namingFunctions.createName(path, 'large--and--primary--and--default');
          expect(result).toBe('button-page-button-large-primary-default');
        });

        it('should handle conflicts and --and-- format', () => {
          const path = [
            { name: 'button page', type: 'PAGE' },
            { name: 'button', type: 'COMPONENT_SET' },
          ];
          const conflicts = { default: ['size', 'theme'] };

          const variants = { size: 'default', theme: 'primary', state: 'hover' };
          const result = namingFunctions.createName(
            path,
            'default--and--primary--and--hover',
            conflicts,
            variants,
          );
          expect(result).toBe('button-page-button-size_default-theme_primary-hover');
        });
      });
    });
  });
  describe('with context that has page disabled', () => {
    const testContext: NamingContext = {
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

    let namingFunctions: ReturnType<typeof createNamingConvention>;

    beforeEach(() => {
      namingFunctions = createNamingConvention(testContext);
    });

    describe('createName', () => {
      it('should use all custom delimiters and exclude page from path', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
          { name: 'text', type: 'TEXT' },
        ];
        const conflicts = { default: ['size'] };

        const result = namingFunctions.createName(
          path,
          'Size=Default--Theme=Primary--State=Hover',
          conflicts,
        );

        expect(result).toBe('button/text.size_default---primary---hover');
      });
    });
  });
});
