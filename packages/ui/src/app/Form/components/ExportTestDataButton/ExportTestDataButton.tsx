import { FC } from "react";
import { Button } from "../../../components/Button";
import { messageMainThread } from "../../../utilities";
import { useOnPluginMessage } from "../../../hooks";

export const ExportTestDataButton: FC = () => {
  useOnPluginMessage('test-data-exported', (msg) => {
    // Create and trigger download
    const blob = new Blob([msg.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figma-test-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const exportTestData = () => {
    messageMainThread({ type: 'export-test-data' });
  };

  return <Button onClick={exportTestData}>Export Test Data</Button>
};
