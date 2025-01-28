function calculateGradientAngle(matrix: Transform): number {
  const [[a, b]] = matrix;
  // Calculate angle using arctangent of matrix components
  const angle = Math.atan2(-b, -a) * (180 / Math.PI);
  return Math.round((angle + 180) % 180);
}

function calculateStopPositions(
  gradientTransform: Transform,
  stops: readonly ColorStop[],
): string[] {
  const [[a, b, tx], [c, d, ty]] = gradientTransform;

  // Calculate gradient vector length for normalization
  const vectorLength = Math.sqrt(a * a + c * c);

  return stops.map((stop) => {
    const color = stop.color.a !== 1
      ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
      : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();

    // Apply affine transformation to the stop position
    const t = stop.position;
    
    // Transform point using matrix multiplication
    const transformedX = (a * t) + tx;
    const transformedY = (c * t) + ty;

    // Project point onto gradient vector and normalize
    const dotProduct = (transformedX * a + transformedY * c);
    const position = (dotProduct / (vectorLength * vectorLength)) * 100;

    return `${color} ${position.toFixed(2)}%`;
  });
}

export function processGradient(fill: GradientPaint, width: number, height: number): string {
  switch (fill.type) {
    case 'GRADIENT_LINEAR': {
      const angle = calculateGradientAngle(fill.gradientTransform);
      const stops = calculateStopPositions(fill.gradientTransform, fill.gradientStops);
      return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    }
    case 'GRADIENT_RADIAL': {
      const stops = fill.gradientStops.map(stop => {
        const color = stop.color.a !== 1
          ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
          : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
        return `${color} ${stop.position * 100}%`;
      }).join(', ');
      return `radial-gradient(100% 100% at 100% 100%, ${stops})`;
    }
    case 'GRADIENT_ANGULAR': {
      const stops = fill.gradientStops.map(stop => {
        const color = stop.color.a !== 1
          ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
          : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
        return `${color} ${stop.position * 360}deg`;
      }).join(', ');
      return `conic-gradient(from 134deg at 50% 50%, ${stops})`;
    }
    case 'GRADIENT_DIAMOND': {
      const stops = fill.gradientStops.map(stop => {
        const color = stop.color.a !== 1
          ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
          : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
        return `${color} ${stop.position * 100}%`;
      }).join(', ');
      return `linear-gradient(to bottom right, ${stops}) bottom right / 50% 50% no-repeat, ` +
        `linear-gradient(to bottom left, ${stops}) bottom left / 50% 50% no-repeat, ` +
        `linear-gradient(to top left, ${stops}) top left / 50% 50% no-repeat, ` +
        `linear-gradient(to top right, ${stops}) top right / 50% 50% no-repeat`;
    }
    default:
      return '';
  }
} 