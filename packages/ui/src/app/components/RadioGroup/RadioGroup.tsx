import { ChangeEvent, useId } from 'react';

export interface RadioGroupOption<T extends string | number = string> {
  value: T;
  label: string;
}

export interface RadioGroupProps<T extends string | number = string> {
  label: string;
  name: string;
  value?: T;
  onChange: (value: T) => void;
  options: RadioGroupOption<T>[];
}

export const RadioGroup = <T extends string | number = string>({
  label,
  name,
  value,
  onChange,
  options,
}: RadioGroupProps<T>) => {
  const id = useId();
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedOption = options.find((option) => option.value === event.target.value);
    if (selectedOption) {
      onChange(selectedOption.value);
    }
  };

  return (
    <div className="parsing-mode-group">
      <label className="parsing-mode-label" id={id}>
        {label}
      </label>
      <div className="radio-group" aria-labelledby={id}>
        {options.map((option) => (
          <label key={option.value} className="radio-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={handleChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
