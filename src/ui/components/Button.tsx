import React from 'react';
import { ButtonProps } from '../types';

/**
 * Reusable button component with loading and variant support
 * Follows plugin UI patterns
 */
export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  loading = false,
}: ButtonProps): JSX.Element {
  const handleClick = () => {
    if (!disabled && !loading) {
      onClick();
    }
  };

  return (
    <div className="button-container">
      <button className={`button ${variant}`} onClick={handleClick} disabled={disabled || loading}>
        {children}
      </button>
      {loading && <div className="spinner" />}
    </div>
  );
}
