import { ChangeEvent, FC, InputHTMLAttributes } from 'react';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  type?: 'password' | 'text';
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  linkText?: string;
  onLinkClick?: () => void;
}

export const Input: FC<InputProps> = ({
  label,
  id,
  onChange,
  type = 'text',
  hint,
  linkText,
  onLinkClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-field ${className}`}>
      <div className="input-field__header">
        <label htmlFor={id} className="input-field__label">
          {label}
        </label>
        {linkText && (
          <button type="button" className="input-field__link" onClick={onLinkClick}>
            {linkText}
          </button>
        )}
      </div>
      <div className="input-field__container">
        <input {...props} id={id} type={type} onChange={onChange} className="input-field__input" />
      </div>
      {hint && <p className="input-field__hint">{hint}</p>}
    </div>
  );
};
