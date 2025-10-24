import { FC, ReactNode } from 'react';
import cn from 'classnames';
import styles from './Card.module.scss';
import { LabelLink } from '../LabelLink/LabelLink';

interface StaticCardProps {
  title?: string;
  children?: ReactNode;
  linkHref?: string;
  linkLabel?: string;
}

export const StaticCard: FC<StaticCardProps> = ({ title, children, linkHref, linkLabel }) => {
  return (
    <div className={cn(styles.card, styles.static)}>
      {title ? (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      ) : null}
      <div className={styles.content}>
        {children}
        {linkHref && linkLabel ? (
          <div className={styles.link}>
            <LabelLink href={linkHref} bold>
              {linkLabel}
            </LabelLink>
          </div>
        ) : null}
      </div>
    </div>
  );
};
