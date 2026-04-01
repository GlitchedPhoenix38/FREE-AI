import { Settings, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header({ onSettingsClick, settingsOpen }) {
  const { isConnected, isCheckingConnection, checkConnection } = useApp();

  return (
    <header className="h-12 bg-bg-primary border-b border-border-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <h1 className="text-lg font-semibold">
          Local<span className="text-accent">Mind</span>
        </h1>
        <span className="text-xs text-text-muted ml-2 hidden sm:inline">
          Privacy-First AI Image Editor
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={checkConnection}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          title="Refresh connection"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingConnection ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Check</span>
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isCheckingConnection
                ? 'bg-yellow-500 animate-pulse'
                : isConnected
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-text-secondary hidden sm:inline">
            {isCheckingConnection
              ? 'Checking...'
              : isConnected
              ? 'Connected'
              : 'Disconnected'}
          </span>
        </div>

        <button
          onClick={onSettingsClick}
          className={`p-2 rounded-lg transition-colors ${
            settingsOpen
              ? 'bg-accent/20 text-accent'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
