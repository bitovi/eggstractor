import { FC, useState } from 'react';
import { useOnPluginMessage } from '../../../hooks';
import { messageMainThread } from '../../../utilities';

export const Warnings: FC = () => {
  const [warnings, setWarnings] = useState<string[]>([]);
  useOnPluginMessage('output-styles', (msg) => {
    setWarnings(msg.warnings || []);
  });

  if (!warnings.length) {
    return null;
  }

  const onClick = (nodeId: string) => {
    if (nodeId) {
      messageMainThread({
        type: 'select-node',
        nodeId,
      });
    }
  };

  return (
    <details open>
      <summary>
        <span role="img" aria-hidden="true">
          ⚠️
        </span>{' '}
        Warnings (${warnings.length}){' '}
        <span role="img" aria-hidden="true">
          ⚠️
        </span>
      </summary>
      <ul>
        {warnings.map((warning, i) => {
          const nodeMatch = warning.match(/\(node: ([^)]+)\)/);
          const nodeId = nodeMatch?.[1];
          return nodeId ? (
            <li className="warning-item" key={i}>
              {/* TODO use a button tag instead of anchor tag and style it as a "link" */}
              <a data-node-id="${nodeId}" onClick={() => onClick(nodeId)}>
                ${warning}
              </a>
            </li>
          ) : (
            <li className="warning-item" key={i}>
              ${warning}
            </li>
          );
        })}
      </ul>
    </details>
  );
};
