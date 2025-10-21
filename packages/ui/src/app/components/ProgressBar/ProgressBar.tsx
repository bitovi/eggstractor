import { FC, HTMLAttributes } from 'react';
import styles from './ProgressBar.module.scss';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  percentage: number;
  message: string;
}

export const ProgressBar: FC<ProgressBarProps> = ({ percentage, message, ...rest }) => {
  return (
    <div className={styles['progress-container']} {...rest}>
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{
            width: `${percentage}%`,
          }}
        ></div>
      </div>
      <div className={styles['progress-text']}>{message}</div>
    </div>
  );
};
