import { FC, useState } from 'react';
import { ProgressBar } from '../../../../components';
import { useOnPluginMessage } from '../../../../hooks';
import { TIME_TO_REMOVE_PROGRESS_BAR } from '../../constants';
import { messageMainThread } from '../../../../utils';

export const GeneratingStylesProgressBar: FC = () => {
  const [renderProgressBar, setRenderProgressBar] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [message, setMessage] = useState('');

  useOnPluginMessage('progress-start', () => {
    setRenderProgressBar(true);
    setPercentage(0);
    setMessage('Starting...');
  });

  useOnPluginMessage('progress-update', (msg) => {
    setPercentage(msg.progress);
    setMessage(msg.message);
    messageMainThread({ type: 'progress-updated', id: msg.id });
  });

  useOnPluginMessage('progress-end', () => {
    setPercentage(100);
    setMessage('Complete!');
    setTimeout(() => {
      setRenderProgressBar(false);
    }, TIME_TO_REMOVE_PROGRESS_BAR);
  });

  if (!renderProgressBar) {
    return null;
  }

  return <ProgressBar percentage={percentage} message={message} />;
};
