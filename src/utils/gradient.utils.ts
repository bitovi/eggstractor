import { GradientProcessing } from '../types';

export function getGradientAngle(transform: Transform): number {
  const [[a, b], [c, d]] = transform;
  const angle = Math.atan2(b, a) * (180 / Math.PI);
  return ((angle + 90 + 360) % 360);
}

export function processGradient(
  fill: GradientPaint,
  stops: GradientProcessing[]
): GradientProcessing {
  switch (fill.type) {
    case "GRADIENT_LINEAR": {
      const angle = 360 - Math.round(getGradientAngle(fill.gradientTransform));
      return {
        value: `linear-gradient(${angle}deg, ${stops.map(s => s.value).join(', ')})`,
        rawValue: `linear-gradient(${angle}deg, ${stops.map(s => s.rawValue).join(', ')})`
      };
    }
    case "GRADIENT_RADIAL": {
      const [[a, b], [c, d]] = fill.gradientTransform;
      const centerX = Math.round((1 + c) * 100);
      const centerY = Math.round((1 + d) * 100);
      
      return {
        value: `radial-gradient(100% 100% at ${centerX}% ${centerY}%, ${stops.map(s => s.value).join(', ')})`,
        rawValue: `radial-gradient(100% 100% at ${centerX}% ${centerY}%, ${stops.map(s => s.rawValue).join(', ')})`
      };
    }
    case "GRADIENT_ANGULAR": {
      const angle = Math.round(getGradientAngle(fill.gradientTransform));
      return {
        value: `conic-gradient(from ${angle}deg at 50% 50%, ${stops.map(s => {
          const position = s.value.split(' ')[1];
          const color = s.value.split(' ')[0];
          const degrees = Math.round(parseFloat(position) * 3.6);
          return `${color} ${degrees}deg`;
        }).join(', ')})`,
        rawValue: `conic-gradient(from ${angle}deg at 50% 50%, ${stops.map(s => {
          const position = s.rawValue.split(' ')[1];
          const color = s.rawValue.split(' ')[0];
          const degrees = Math.round(parseFloat(position) * 3.6);
          return `${color} ${degrees}deg`;
        }).join(', ')})`
      };
    }
    case "GRADIENT_DIAMOND": {
      const directions = ['to bottom right', 'to bottom left', 'to top left', 'to top right'];
      const positions = ['bottom right', 'bottom left', 'top left', 'top right'];
      
      return {
        value: directions.map((dir, i) => 
          `linear-gradient(${dir}, ${stops.map(s => s.value).join(', ')}) ${positions[i]} / 50% 50% no-repeat`
        ).join(', '),
        rawValue: directions.map((dir, i) => 
          `linear-gradient(${dir}, ${stops.map(s => s.rawValue).join(', ')}) ${positions[i]} / 50% 50% no-repeat`
        ).join(', ')
      };
    }
    default:
      return { value: '', rawValue: '' };
  }
} 