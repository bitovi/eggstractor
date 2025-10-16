import { FC, useState, ReactNode } from 'react';
import cn from 'classnames';
import styles from './Card.module.scss';
import { LabelLink } from '../LabelLink/LabelLink';

interface CardProps {
  title?: string;
  children?: ReactNode;
  type?: 'static' | 'expanded' | 'collapsed';
  linkHref?: string;
  linkLabel?: string;
}

export const Card: FC<CardProps> = ({ title, children, type = 'static', linkHref, linkLabel }) => {
  const [isExpanded, setIsExpanded] = useState(type === 'expanded');
  const isCollapsible = type === 'collapsed' || type === 'expanded';

  const handleToggle = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={cn(styles.card, {
        [styles.static]: type === 'static',
        [styles.collapsible]: isCollapsible,
        [styles.expanded]: isExpanded,
        [styles.collapsed]: !isExpanded && isCollapsible,
      })}
    >
      {title && (
        <div className={styles.header} onClick={handleToggle}>
          <h3 className={styles.title}>{title}</h3>
          {isCollapsible && (
            <span className={styles.icon}>
              {isExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <path
                    d="M26 12L16 22L6 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <path
                    d="M12 6L22 16L12 26"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          )}
        </div>
      )}
      {(type === 'static' || isExpanded) && (
        <div className={styles.content}>
          {children}
          {linkHref && linkLabel && (
            <div className={styles.link}>
              <LabelLink href={linkHref} bold>
                {linkLabel}
              </LabelLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
