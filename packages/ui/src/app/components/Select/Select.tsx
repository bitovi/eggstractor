import { ChangeEvent, SelectHTMLAttributes } from 'react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  className?: string;
}

export interface SelectProps<T extends string = string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (option: SelectOption<T>) => void;
}

export const Select = <T extends string = string>({
  options,
  value,
  onChange,
  ...props
}: SelectProps<T>) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = options.find((option) => option.value === event.target.value);
    if (selectedOption) {
      onChange(selectedOption);
    }
  };

  return (
    <select {...props} value={value} onChange={handleChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value} className={option.className}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
