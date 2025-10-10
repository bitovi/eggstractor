import { FC } from 'react';
import { useStatus } from './context';

export const Status: FC = () => {
  const { status } = useStatus();

  if (status.state === 'pr-created') {
    return (
      <span id="status">
        PR Created:{' '}
        <a href={status.url} target="_blank" rel="noreferrer">
          View PR
        </a>
      </span>
    );
  }

  if (status.state === 'creating-pr') {
    return <span id="status">Creating PR...</span>;
  }

  return null;
};
