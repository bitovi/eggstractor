import { FC } from 'react';

interface ProgressBarProps {
  percentage: number;
  message: string;
}

export const ProgressBar: FC<ProgressBarProps> = ({ percentage, message }) => {
  return (
    <div id="progressContainer">
      <div
        id="progressBar"
        style={{ width: '100%', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}
      >
        <div
          id="progressFill"
          style={{
            width: `${percentage}%`,
            height: '20px',
            background: '#007cba',
            transition: 'width 0.3s',
          }}
        ></div>
      </div>
      <div id="progressText" style={{ color: '#999999' }}>
        {message}
      </div>
    </div>
  );
};
