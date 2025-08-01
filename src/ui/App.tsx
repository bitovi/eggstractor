import React from 'react';
import PluginInterface from './components/PluginInterface';
import { usePluginData } from './hooks/usePluginData';

/**
 * Main App component for Eggstractor plugin UI
 * Manages plugin state and renders the main interface
 */
export default function App(): JSX.Element {
  const pluginData = usePluginData();

  return (
    <div className="plugin-container">
      <PluginInterface {...pluginData} />
    </div>
  );
}
