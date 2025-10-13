import { FC } from 'react';

interface ProgressBarProps {
  percentage: number;
  message: string;
}

export const ProgressBar: FC<ProgressBarProps> = ({ percentage, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-text">{message}</div>
    </div>
  );
};
