import { StylesForVariantsCombination } from '../../../transformers/variants';

export const output: Record<string, StylesForVariantsCombination> = {
  'theme=green-theme': {
    styles: {
      color: 'green',
    },
    variants: {
      theme: 'green-theme',
    },
  },
  'theme=pink-theme': {
    styles: {
      color: 'pink',
      height: '8px',
      'line-height': '1px',
    },
    variants: {
      theme: 'pink-theme',
    },
  },
  'theme=purple-theme': {
    styles: {
      color: 'purple',
      height: '32px',
      'line-height': '15px',
    },
    variants: {
      theme: 'purple-theme',
    },
  },
  'theme=red-theme': {
    styles: {
      color: 'red',
    },
    variants: {
      theme: 'red-theme',
    },
  },
  'theme=yellow-theme': {
    styles: {
      color: 'yellow',
    },
    variants: {
      theme: 'yellow-theme',
    },
  },
  'size=small--icon=false': {
    styles: {
      height: '10px',
      'line-height': '5px',
    },
    variants: {
      size: 'small',
      icon: 'false',
    },
  },
  'size=medium--icon=true': {
    styles: {
      height: '16px',
      'line-height': '5px',
    },
    variants: {
      size: 'medium',
      icon: 'true',
    },
  },
  'size=medium--icon=false': {
    styles: {
      height: '20px',
      'line-height': '10px',
    },
    variants: {
      size: 'medium',
      icon: 'false',
    },
  },
  'size=large--icon=false': {
    styles: {
      height: '30px',
    },
    variants: {
      size: 'large',
      icon: 'false',
    },
  },
  'size=large--icon=true': {
    styles: {
      height: '32px',
    },
    variants: {
      size: 'large',
      icon: 'true',
    },
  },
  'theme=red-theme--size=medium--icon=false': {
    styles: {
      height: '40px',
      'line-height': '20px',
    },
    variants: {
      theme: 'red-theme',
      size: 'medium',
      icon: 'false',
    },
  },
  'size=small--icon=true': {
    styles: {
      height: '8px',
      'line-height': '1px',
    },
    variants: {
      size: 'small',
      icon: 'true',
    },
  },
  'size=large': {
    styles: {
      'line-height': '15px',
    },
    variants: {
      size: 'large',
    },
  },
};
