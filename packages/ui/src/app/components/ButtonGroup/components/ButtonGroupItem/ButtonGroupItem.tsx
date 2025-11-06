import { ButtonHTMLAttributes, FC } from 'react';
import cn from 'classnames';
import './ButtonGroupItem.scss';

type ButtonGroupItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const ButtonGroupItem: FC<ButtonGroupItemProps> = ({
  children,
  type = 'button',
  active,
  ...props
}) => {
  return (
    <button
      {...props}
      className={cn('button-group-item-container', props.className, { active })}
      type={type}
    >
      <span className="button-group-item">
        <span className="button-group-item-label">{children}</span>
      </span>
    </button>
  );
};
