import { ChangeEvent, FC, FocusEvent, InputHTMLAttributes, useId, useRef, useState } from 'react';
import styles from './Input.module.scss';
import cn from 'classnames';
import { LabelLink } from '../LabelLink';
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  type?: 'password' | 'text';
  onChange: (value: string) => void;
  linkHref?: string;
  linkLabel?: string;
  hint?: string;
  error?: boolean;
}

export const Input: FC<InputProps> = ({
  label,
  id: idProp,
  onChange,
  type = 'text',
  linkHref,
  linkLabel,
  hint,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  error,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const id = idProp || generatedId;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const [isFocused, setIsFocused] = useState(false);

  const onFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocusProp?.(e);
  };

  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlurProp?.(e);
  };

  return (
    <div
      className={cn(styles['input-container'], {
        [styles['active']]: isFocused,
        [styles['error']]: error,
      })}
    >
      <label className={styles['label-container']} htmlFor={id}>
        <span className={styles['label-text']}>{label}</span>
        {linkHref || linkLabel ? (
          <LabelLink href={linkHref}>{linkLabel ?? linkHref}</LabelLink>
        ) : null}
      </label>
      <input
        ref={inputRef}
        {...props}
        id={id}
        type={type}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={styles.input}
      />
      {hint ? (
        <div
          className={styles['hint']}
          onClick={() => {
            inputRef.current?.focus();
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
};
