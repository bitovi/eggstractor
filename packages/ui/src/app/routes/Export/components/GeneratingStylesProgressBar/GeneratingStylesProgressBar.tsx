import { FC, useState } from 'react';
import { ProgressBar } from '../../../../components';
import { useOnPluginMessage } from '../../../../hooks';
import { TIME_TO_REMOVE_PROGRESS_BAR } from '../../constants';
import { messageMainThread } from '../../../../utils';
import { useGeneratedStyles } from '../../../../context';

export const GeneratingStylesProgressBar: FC = () => {
  const { loading, setLoading, setGeneratedStyles, setWarnings } = useGeneratedStyles();
  const [percentage, setPercentage] = useState(0);
  const [message, setMessage] = useState('');

  useOnPluginMessage('progress-start', () => {
    setLoading(true);
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
      setLoading(false);
    }, TIME_TO_REMOVE_PROGRESS_BAR);
  });

  useOnPluginMessage('output-styles', (msg) => {
    setGeneratedStyles(msg.styles);
    setWarnings(msg.warnings || []);
  });

  useOnPluginMessage('error', () => {
    // Reset loading state when an error occurs
    setLoading(false);
    setPercentage(0);
    setMessage('');
  });

  if (!loading) {
    return null;
  }

  return <ProgressBar percentage={percentage} message={message} />;
};
