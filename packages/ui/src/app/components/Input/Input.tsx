import { ChangeEvent, FC, InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  type?: 'password' | 'text';
  onChange: (value: string) => void;
}

export const Input: FC<InputProps> = ({ label, id, onChange, type="text", ...props }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
      </label>
      <input {...props} id={id} type={type} onChange={handleChange} />
    </div>
  );
};
