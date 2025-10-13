import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'warning';
  className?: string;
}

export const Card: FC<CardProps> = ({ children, variant = 'default', className = '' }) => {
  const cardClass = variant === 'warning' ? 'card card--warning' : 'card';

  return <div className={`${cardClass} ${className}`}>{children}</div>;
};
