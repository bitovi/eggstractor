import { ButtonHTMLAttributes, FC } from 'react';
import cn from 'classnames';

export const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  type = 'button',
  ...props
}) => {
  return (
    <button {...props} className={cn('button', props.className)} type={type}>
      {children}
    </button>
  );
};
