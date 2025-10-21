import { FC, useState, ReactNode } from 'react';
import cn from 'classnames';
import styles from './Card.module.scss';
import { LabelLink } from '../LabelLink/LabelLink';

interface ExpandableCardProps {
  title: string;
  children?: ReactNode;
  expanded?: boolean;
  linkHref?: string;
  linkLabel?: string;
}

export const ExpandableCard: FC<ExpandableCardProps> = ({
  title,
  children,
  expanded = false,
  linkHref,
  linkLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(expanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(styles.card, styles.collapsible, {
        [styles.expanded]: isExpanded,
        [styles.collapsed]: !isExpanded,
      })}
    >
      <button className={styles.header} onClick={handleToggle}>
        <h3 className={styles.title}>{title}</h3>
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
      </button>

      {isExpanded && (
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
