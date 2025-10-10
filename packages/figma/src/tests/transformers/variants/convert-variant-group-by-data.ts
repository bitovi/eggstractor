import { TokenCollection } from '../../../types';

/**
 * Token collection for testing that combinatorial and template variant can
 * parse produce the same results when expected.
 *
 * source: https://www.figma.com/design/mzCtOgyYUuWKNeMqeZFdBc/Basic-fully-unique-variants?node-id=0-1&t=BjIuG1EVU6S3b2zG-1
 */
export const tokenCollection: Readonly<TokenCollection> = {
  tokens: [
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-2',
      value: '#ff0000',
      rawValue: '#ff0000',
      property: 'background',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:3',
      },
      componentId: '1:3',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-2',
      value:
        'inset 0 1px 0 0 #000000, inset -1px 0 0 0 #000000, inset 0 -1px 0 0 #000000, inset 1px 0 0 0 #000000',
      rawValue:
        'inset 0 1px 0 0 #000000, inset -1px 0 0 0 #000000, inset 0 -1px 0 0 #000000, inset 1px 0 0 0 #000000',
      valueType: 'px',
      property: 'box-shadow',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:3',
      },
      componentId: '1:3',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-2',
      value: '0px',
      rawValue: '0px',
      valueType: 'px',
      property: 'padding',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:3',
      },
      componentId: '1:3',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-1',
      value: '#0000ff',
      rawValue: '#0000ff',
      property: 'background',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:25',
      },
      componentId: '1:25',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-1',
      value:
        'inset 0 2px 0 0 #000000, inset -2px 0 0 0 #000000, inset 0 -2px 0 0 #000000, inset 2px 0 0 0 #000000',
      rawValue:
        'inset 0 2px 0 0 #000000, inset -2px 0 0 0 #000000, inset 0 -2px 0 0 #000000, inset 2px 0 0 0 #000000',
      valueType: 'px',
      property: 'box-shadow',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:25',
      },
      componentId: '1:25',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-2--border-1',
      value: '0px',
      rawValue: '0px',
      valueType: 'px',
      property: 'padding',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-2--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:25',
      },
      componentId: '1:25',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-2',
      value: '#008000',
      rawValue: '#008000',
      property: 'background',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:28',
      },
      componentId: '1:28',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-2',
      value:
        'inset 0 3px 0 0 #000000, inset -3px 0 0 0 #000000, inset 0 -3px 0 0 #000000, inset 3px 0 0 0 #000000',
      rawValue:
        'inset 0 3px 0 0 #000000, inset -3px 0 0 0 #000000, inset 0 -3px 0 0 #000000, inset 3px 0 0 0 #000000',
      valueType: 'px',
      property: 'box-shadow',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:28',
      },
      componentId: '1:28',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-2',
      value: '0px',
      rawValue: '0px',
      valueType: 'px',
      property: 'padding',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-2',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:28',
      },
      componentId: '1:28',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-1',
      value: '#ffff00',
      rawValue: '#ffff00',
      property: 'background',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:31',
      },
      componentId: '1:31',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-1',
      value:
        'inset 0 4px 0 0 #000000, inset -4px 0 0 0 #000000, inset 0 -4px 0 0 #000000, inset 4px 0 0 0 #000000',
      rawValue:
        'inset 0 4px 0 0 #000000, inset -4px 0 0 0 #000000, inset 0 -4px 0 0 #000000, inset 4px 0 0 0 #000000',
      valueType: 'px',
      property: 'box-shadow',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:31',
      },
      componentId: '1:31',
      componentSetId: '1:15',
    },
    {
      type: 'style',
      name: 'page-1_component-1_color-1--border-1',
      value: '0px',
      rawValue: '0px',
      valueType: 'px',
      property: 'padding',
      path: [
        {
          name: 'page-1',
          type: 'PAGE',
        },
        {
          name: 'component-1',
          type: 'COMPONENT_SET',
        },
        {
          name: 'color-1--border-1',
          type: 'COMPONENT',
        },
      ],
      variableTokenMapByProperty: new Map(), //{},
      metadata: {
        figmaId: '1:31',
      },
      componentId: '1:31',
      componentSetId: '1:15',
    },
  ],
  components: {
    '1:3': {
      type: 'COMPONENT',
      id: '1:3',
      componentSetId: '1:15',
      variantProperties: {
        color: '2',
        border: '2',
      },
    },
    '1:25': {
      type: 'COMPONENT',
      id: '1:25',
      componentSetId: '1:15',
      variantProperties: {
        color: '2',
        border: '1',
      },
    },
    '1:28': {
      type: 'COMPONENT',
      id: '1:28',
      componentSetId: '1:15',
      variantProperties: {
        color: '1',
        border: '2',
      },
    },
    '1:31': {
      type: 'COMPONENT',
      id: '1:31',
      componentSetId: '1:15',
      variantProperties: {
        color: '1',
        border: '1',
      },
    },
  },
  componentSets: {
    '1:15': {
      type: 'COMPONENT_SET',
      id: '1:15',
      name: 'Component 1',
      variantPropertyDefinitions: {
        color: ['2', '1'],
        border: ['1', '2'],
      },
    },
  },
  instances: {},
};
