export interface GradientStop {
  color: {
    variable: string;
    value: RGBA;
  };
  position: number;
}

export interface GradientValue {
  type: string;
  stops: GradientStop[];
  transform: Transform;
}

export interface GradientToken {
  type: 'gradient';
  value: GradientValue;
}

export interface GradientProcessing {
  value: string;
  rawValue: string;
} 