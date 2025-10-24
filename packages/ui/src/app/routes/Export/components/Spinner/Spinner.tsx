import { FC } from 'react';
import styles from './Spinner.module.scss';

export const Spinner: FC = () => {
  return (
    <div className={styles.spinner}>
      <svg
        className={styles['outer-circle']}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="2" />
      </svg>
      <svg
        className={styles['inner-circle']}
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <circle cx="6" cy="6" r="6" fill="white" />
      </svg>
    </div>
  );
};
