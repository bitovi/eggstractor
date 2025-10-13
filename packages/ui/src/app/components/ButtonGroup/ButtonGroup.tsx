import { LabelLink } from '../LabelLink/LabelLink';
import { ButtonGroupItem } from './components/ButtonGroupItem';
import styles from './ButtonGroup.module.scss';

export interface ButtonGroupOption<T extends string | number = string> {
  value: T;
  label: string;
}

export interface ButtonGroupProps<T extends string | number = string> {
  label: string;
  value?: T;
  linkHref?: string;
  linkLabel?: string;
  hint?: string;
  onChange: (value: T) => void;
  options: ButtonGroupOption<T>[];
}

export const ButtonGroup = <T extends string | number = string>({
  label,
  value,
  onChange,
  options,
  linkHref,
  linkLabel,
  hint,
}: ButtonGroupProps<T>) => {
  return (
    <>
      <div className={styles['button-group-label']}>
        <span>{label}</span>
        {linkHref || linkLabel ? (
          <LabelLink href={linkHref}>{linkLabel ?? linkHref}</LabelLink>
        ) : null}
      </div>
      <div role="group" aria-label={label} className={styles['button-group']}>
        {options.map((option) => (
          <ButtonGroupItem
            key={option.value}
            active={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </ButtonGroupItem>
        ))}
      </div>
      {hint ? <div className={styles['button-group-hint']}>{hint}</div> : null}
    </>
  );
};
