// Quick validation script for instance override functionality
import { generateInstanceMixins } from '../transformers/scss.transformer';
import { InstanceOverride } from '../services/instance.service';
import { StyleToken } from '../types';

// Create some mock override data to test the mixin generation
const createMockOverride = (name: string, overrides: Partial<StyleToken>[]): InstanceOverride => {
  return {
    instanceId: `instance-${name.toLowerCase().replace(' ', '-')}`,
    instanceName: name,
    componentId: 'component-1',
    overrideTokens: overrides.map((override, index) => ({
      type: 'style',
      name: `${name.toLowerCase()}-${override.property}`,
      property: override.property || 'background',
      value: override.value || '#000000',
      rawValue: override.rawValue || '#000000',
      path: [{ name, type: 'INSTANCE' }],
      metadata: { figmaId: `instance-${name.toLowerCase()}` },
      ...override,
    } as StyleToken)),
    allTokens: [],
  };
};

// Test the mixin generation
const testOverrides: InstanceOverride[] = [
  createMockOverride('Primary Button', [
    { property: 'background', value: '#cc3333', rawValue: '#cc3333' },
    { property: 'border', value: '2px solid #991a1a', rawValue: '2px solid #991a1a' },
  ]),
  createMockOverride('Secondary Button', [
    { property: 'background', value: '#e6e6e6', rawValue: '#e6e6e6' },
    { property: 'border-radius', value: '4px', rawValue: '4px' },
  ]),
  createMockOverride('No Override Button', []), // No overrides
];

console.log('=== Generated Instance Mixins ===');
const mixins = generateInstanceMixins(testOverrides);
console.log(mixins);

console.log('\n=== Test completed successfully ===');
