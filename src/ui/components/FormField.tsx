import React from 'react';
import { FormFieldProps } from '../types';

/**
 * Reusable form field component
 * Handles different input types following UI conventions
 */
export default function FormField({
  id,
  label,
  type,
  value,
  placeholder,
  options,
  onChange,
}: FormFieldProps): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {type === 'select' ? (
        <select id={id} value={value} onChange={handleChange}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
