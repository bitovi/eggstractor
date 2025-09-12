import { StylesForVariantsCombination } from '../../../../transformers/variants';

export const output: Record<string, StylesForVariantsCombination> = {
  'theme=green-theme': {
    styles: {
      color: 'green',
    },
    variants: {
      theme: 'green-theme',
    },
    path: [],
  },
  'theme=red-theme': {
    styles: {
      color: 'red',
    },
    variants: {
      theme: 'red-theme',
    },
    path: [],
  },
  'theme=yellow-theme': {
    styles: {
      color: 'yellow',
    },
    variants: {
      theme: 'yellow-theme',
    },
    path: [],
  },
  'size=small--icon=false': {
    styles: {
      height: '10px',
    },
    variants: {
      size: 'small',
      icon: 'false',
    },
    path: [],
  },
  'size=medium--icon=true': {
    styles: {
      height: '16px',
    },
    variants: {
      size: 'medium',
      icon: 'true',
    },
    path: [],
  },
  'size=medium--icon=false': {
    styles: {
      height: '20px',
    },
    variants: {
      size: 'medium',
      icon: 'false',
    },
    path: [],
  },
  'size=large--icon=false': {
    styles: {
      height: '30px',
    },
    variants: {
      size: 'large',
      icon: 'false',
    },
    path: [],
  },
  'size=large--icon=true': {
    styles: {
      height: '32px',
    },
    variants: {
      size: 'large',
      icon: 'true',
    },
    path: [],
  },
  'size=small--icon=true': {
    styles: {
      height: '8px',
    },
    variants: {
      size: 'small',
      icon: 'true',
    },
    path: [],
  },
};
