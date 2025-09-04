import { BaseToken } from '../../../types';
import { createNamingContext, NamingContextConfig } from '../../../utils';

describe('createNamingContext', () => {
  describe('with default context', () => {
    let namingContext: ReturnType<typeof createNamingContext>;

    beforeEach(() => {
      namingContext = createNamingContext();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('createName', () => {
      const path: BaseToken['path'] = [
        { name: 'button page', type: 'SECTION' },
        { name: 'button', type: 'COMPONENT_SET' },
      ];
      it('should handle ROOT variant', () => {
        // const result = namingContext.createName(path, 'ROOT');
        const result = namingContext.createName(path);
        expect(result).toBe('button-page-button');
      });

      it('should extract just the value from property-value pairs', () => {
        // const result = namingContext.createName(path, 'Size=Large');
        const result = namingContext.createName(path, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-large');
      });

      it('should handle multiple variants', () => {
        // const result = namingContext.createName(path, 'Size=Large--Theme=Primary');
        const result = namingContext.createName(path, {}, { Size: 'Large', Theme: 'Primary' });
        expect(result).toBe('button-page-button-large-primary');
      });

      it('should handle multi-word values', () => {
        // const result = namingContext.createName(path, 'Icon Only=True');
        const result = namingContext.createName(path, {}, { 'Icon Only': 'True' });
        expect(result).toBe('button-page-button-true');
      });

      it('should convert "Multi Bold" to "multi-bold"', () => {
        // const result = namingContext.createName(path, 'Weight=Multi Bold');
        const result = namingContext.createName(path, {}, { Weight: 'Multi Bold' });
        expect(result).toBe('button-page-button-multi-bold');
      });

      it('should handle property name conflicts with prefixing', () => {
        const conflicts = { default: ['size', 'theme', 'sentiment'] };

        // const result = namingContext.createName(
        //   path,
        //   'Size=Default--Theme=Primary--State=Hover',
        //   conflicts,
        // );
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
          { name: 'large--and--link--and--default', type: 'COMPONENT' },
          { name: 'text', type: 'TEXT' },
        ];
        // const result = namingContext.createName(componentPath, 'Size=Large');
        const result = namingContext.createName(componentPath, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-text-large');
      });

      it('should handle empty variant combination', () => {
        // const result = namingContext.createName(path, '');
        const result = namingContext.createName(path);
        expect(result).toBe('button-page-button');
      });

      // it('should handle variants without properties (legacy format)', () => {
      //   // const result = namingContext.createName(path, 'primary');
      //   const result = namingContext.createName(path, {}, { primary: '' });
      //   expect(result).toBe('button-page-button-primary');
      // });

      it('should handle spaces in path names', () => {
        const pathSet: BaseToken['path'] = [
          { name: 'button page', type: 'SECTION' },
          { name: 'button set', type: 'COMPONENT_SET' },
        ];
        // const result = namingContext.createName(pathSet, 'Size=Large');
        const result = namingContext.createName(pathSet, {}, { Size: 'Large' });
        expect(result).toBe('button-page-button-set-large');
      });

      it('should convert everything to lowercase', () => {
        const pathUpperCase: BaseToken['path'] = [
          { name: 'BUTTON PAGE', type: 'SECTION' },
          { name: 'Button', type: 'COMPONENT_SET' },
        ];
        // const result = namingContext.createName(pathUpperCase, 'Size=LARGE');
        const result = namingContext.createName(pathUpperCase, {}, { Size: 'LARGE' });
        expect(result).toBe('button-page-button-large');
      });

      it('should handle boolean values with special rules', () => {
        // const result = namingContext.createName(
        //   path,
        //   'Disabled=True--Required=False--Active=Yes--Hidden=No',
        // );
        const result = namingContext.createName(
          path,
          {},
          { Disabled: 'True', Required: 'False', Active: 'Yes', Hidden: 'No' },
        );
        // true/yes = no prefix, false/no = always prefixed
        expect(result).toBe('button-page-button-true-required_false-yes-hidden_no');
      });

      // describe('for templated input', () => {
      //   // it('should handle --and-- format', () => {
      //   //   // const result = namingContext.createName(path, 'large--and--primary--and--default');
      //   //   const result = namingContext.createName(path, {}, { large: '', primary: '', default: '' });
      //   //   expect(result).toBe('button-page-button-large-primary-default');
      //   // });

      //   // it('should handle conflicts and --and-- format', () => {
      //   //   const conflicts = { default: ['size', 'theme'] };

      //   //   const variants = { size: 'default', theme: 'primary', state: 'hover' };
      //   //   // const result = namingContext.createName(
      //   //   //   path,
      //   //   //   'default--and--primary--and--hover',
      //   //   //   conflicts,
      //   //   //   variants,
      //   //   // );
      //   //    const result = namingContext.createName(
      //   //     path,
      //   //     conflicts,
      //   //     variants,
      //   //   );
      //   //   expect(result).toBe('button-page-button-size_default-theme_primary-hover');
      //   // });
      // });
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
          { name: 'button page', type: 'SECTION' },
          { name: 'button', type: 'COMPONENT_SET' },
          { name: 'text', type: 'TEXT' },
        ];
        const conflicts = { default: ['size'] };

        // const result = namingContext.createName(
        //   path,
        //   'Size=Default--Theme=Primary--State=Hover',
        //   conflicts,
        // );
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
