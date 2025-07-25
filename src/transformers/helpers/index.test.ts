import { createNamingConvention } from './index';

describe('createNamingConvention', () => {
  describe('with default context (CSS-safe)', () => {
    const namingFunctions = createNamingConvention();

    describe('createName', () => {
      it('should handle ROOT variant', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'ROOT');
        expect(result).toBe('button-button-root');
      });

      it('should extract just the value from property-value pairs', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size-Large');
        expect(result).toBe('button-button-large');
      });

      it('should handle multiple variants', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size-Large--Theme-Primary');
        expect(result).toBe('button-button-large-primary');
      });

      it('should handle multi-word values', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Icon Only-True');
        expect(result).toBe('button-button-true');
      });

      it('should convert "Icon Only" to "icon-only"', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Icon Only-Icon Only');
        expect(result).toBe('button-button-icon-only');
      });

      it('should filter out COMPONENT type from path', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
          { name: 'large--and--link--and--default', type: 'COMPONENT' },
          { name: 'text', type: 'TEXT' },
        ];
        const result = namingFunctions.createName(path, 'Size-Large');
        expect(result).toBe('button-button-text-large');
      });

      it('should handle empty variant combination', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, '');
        expect(result).toBe('button-button');
      });

      it('should handle variants without hyphens', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'primary');
        expect(result).toBe('button-button-primary');
      });

      it('should handle spaces in path names', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button set', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size-Large');
        expect(result).toBe('button-page-button-set-large');
      });

      it('should convert everything to lowercase', () => {
        const path = [
          { name: 'BUTTON', type: 'PAGE' },
          { name: 'Button', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createName(path, 'Size-LARGE');
        expect(result).toBe('button-button-large');
      });
    });

    describe('createGroupingKey', () => {
      it('should create grouping key without COMPONENT types', () => {
        const path = [
          { name: 'button', type: 'PAGE' },
          { name: 'button', type: 'COMPONENT_SET' },
          { name: 'large--variant', type: 'COMPONENT' },
          { name: 'text', type: 'TEXT' },
        ];
        const result = namingFunctions.createGroupingKey(path);
        expect(result).toBe('button.button.text');
      });

      it('should handle spaces in grouping key', () => {
        const path = [
          { name: 'button page', type: 'PAGE' },
          { name: 'button set', type: 'COMPONENT_SET' },
        ];
        const result = namingFunctions.createGroupingKey(path);
        expect(result).toBe('button-page.button-set');
      });

      it('should handle empty path', () => {
        const path: Array<{ name: string; type: string }> = [];
        const result = namingFunctions.createGroupingKey(path);
        expect(result).toBe('');
      });

      it('should handle path with only COMPONENT types', () => {
        const path = [{ name: 'component', type: 'COMPONENT' }];
        const result = namingFunctions.createGroupingKey(path);
        expect(result).toBe('');
      });
    });
  });

  describe('with Tailwind v4 context', () => {
    const tailwind4Context = {
      env: 'tailwind-v4',
      delimiters: {
        pathSeparator: '/',
        afterComponentName: '.',
        variantEqualSign: '_',
        betweenVariants: '.',
      },
      duplicate: (name: string, count: number) => `${name}${count}`,
    };

    const namingFunctions = createNamingConvention(tailwind4Context);

    it('should use forward slashes for path separation', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      const result = namingFunctions.createName(path, 'Size-Large');
      expect(result).toBe('button/button.large');
    });

    it('should use dots for variant separation', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      const result = namingFunctions.createName(path, 'Size-Large--Theme-Primary');
      expect(result).toBe('button/button.large.primary');
    });

    it('should handle complex variant combinations', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      const result = namingFunctions.createName(path, 'Size-Large--Icon Only-True--State-Hover');
      expect(result).toBe('button/button.large.true.hover');
    });

    it('should handle ROOT with Tailwind v4 context', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      const result = namingFunctions.createName(path, 'ROOT');
      expect(result).toBe('button/button.root');
    });
  });

  describe('with SCSS context', () => {
    const scssContext = {
      env: 'tailwind-scss',
      delimiters: {
        pathSeparator: '-',
        afterComponentName: '-',
        variantEqualSign: '-',
        betweenVariants: '-',
      },
      duplicate: (name: string, count: number) => `${name}-${count}`,
    };

    const namingFunctions = createNamingConvention(scssContext);

    it('should use hyphens throughout for SCSS compatibility', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      const result = namingFunctions.createName(path, 'Size-Large--Theme-Primary');
      expect(result).toBe('button-button-large-primary');
    });

    it('should use hyphen-based duplicate naming', () => {
      const path = [
        { name: 'button', type: 'PAGE' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];

      const result1 = namingFunctions.createName(path, 'Size-Large');
      const result2 = namingFunctions.createName(path, 'Size-Large');

      expect(result1).toBe('button-button-large');
      expect(result2).toBe('button-button-large-2');
    });
  });
});
