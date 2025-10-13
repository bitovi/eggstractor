import { ButtonHTMLAttributes, FC } from 'react';
import cn from 'classnames';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
}

export const Button: FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  ...props
}) => {
  return (
    <button
      {...props}
      className={cn(styles.button, props.className, {
        [styles.icon]: variant === 'icon',
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
      })}
      type={type}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
};
