import { AnchorHTMLAttributes, FC } from 'react';
import cn from 'classnames';
import styles from './LabelLink.module.scss';

interface LabelLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  bold?: boolean;
}

export const LabelLink: FC<LabelLinkProps> = ({
  bold,
  className: classNameProp,
  children,
  ...props
}) => {
  const className = cn(styles['label-link'], { [styles.bold]: bold }, classNameProp);

  return (
    <a {...props} className={className} target="_blank" rel="noreferrer">
      <span className={styles['link-link-text']}>{children}</span>
    </a>
  );
};
