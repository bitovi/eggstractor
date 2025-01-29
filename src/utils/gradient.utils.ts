function calculateGradientAngle(matrix: Transform): number {
  const [[a], [b]] = matrix;
  
  // Calculate angle in radians using arctangent
  let angleRad = Math.atan2(b, a);
  
  // Convert to degrees and adjust for CSS gradient angle convention
  // CSS gradients: 0deg = to top, 90deg = to right, 180deg = to bottom, 270deg = to left
  let angleDeg = (angleRad * 180) / Math.PI;
  
  // Adjust angle to match CSS gradient convention:
  // (figma starts at 90deg)
  // 1. Add 90 to rotate coordinate system (CSS 0deg is up, math 0deg is right)
  // 2. Negate the angle (CSS rotates clockwise, math rotates counter-clockwise)
  // 3. Add 360 and mod 360 to ensure positive angle
  angleDeg = ((-angleDeg + 90) + 360) % 360;
  
  return Math.round(angleDeg);
}

function calculateStopPositions(
  stops: readonly ColorStop[],
): string[] {
  return stops.map((stop) => {
    const color = stop.color.a !== 1
      ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
      : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
    
    return `${color} ${stop.position * 100}%`;
  });
}

export function processGradient(fill: GradientPaint): string {
  switch (fill.type) {
    case 'GRADIENT_LINEAR': {
      const angle = calculateGradientAngle(fill.gradientTransform);
      const stops = calculateStopPositions(fill.gradientStops);
      return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    }
    // case 'GRADIENT_RADIAL': {
    //   const stops = fill.gradientStops.map(stop => {
    //     const color = stop.color.a !== 1
    //       ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
    //       : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
    //     return `${color} ${stop.position * 100}%`;
    //   }).join(', ');
    //   return `radial-gradient(100% 100% at 100% 100%, ${stops})`;
    // }
    // case 'GRADIENT_ANGULAR': {
    //   const stops = fill.gradientStops.map(stop => {
    //     const color = stop.color.a !== 1
    //       ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
    //       : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
    //     return `${color} ${stop.position * 360}deg`;
    //   }).join(', ');
    //   return `conic-gradient(from 134deg at 50% 50%, ${stops})`;
    // }
    // case 'GRADIENT_DIAMOND': {
    //   const stops = fill.gradientStops.map(stop => {
    //     const color = stop.color.a !== 1
    //       ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
    //       : `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
    //     return `${color} ${stop.position * 100}%`;
    //   }).join(', ');
    //   return `linear-gradient(to bottom right, ${stops}) bottom right / 50% 50% no-repeat, ` +
    //     `linear-gradient(to bottom left, ${stops}) bottom left / 50% 50% no-repeat, ` +
    //     `linear-gradient(to top left, ${stops}) top left / 50% 50% no-repeat, ` +
    //     `linear-gradient(to top right, ${stops}) top right / 50% 50% no-repeat`;
    // }
    default:
      return '';
  }
} 