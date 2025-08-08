import React from 'react';
import { ProgressBarProps } from '../types';

/**
 * Progress bar component for showing generation progress
 * Matches existing plugin progress UI patterns
 */
export default function ProgressBar({ progress }: ProgressBarProps): JSX.Element {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
      </div>
      <div className="progress-text">{progress.message}</div>
    </div>
  );
}
