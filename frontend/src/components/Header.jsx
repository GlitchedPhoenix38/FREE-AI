import { Settings, Sparkles, RefreshCw, Wifi, WifiOff, Globe, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header({ onSettingsClick, settingsOpen }) {
  const { isConnected, isCheckingConnection, checkConnection, mode, cloudProvider, loadLocalModel, localModelStatus, connectionDetails, downloadProgress } = useApp();

  const getModeIcon = () => {
    if (mode === 'online') {
      return <Globe className="w-3.5 h-3.5" />;
    }
    return <WifiOff className="w-3.5 h-3.5" />;
  };

  const getModeColor = () => {
    if (mode === 'online') {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getProviderName = () => {
    if (mode === 'online') {
      const providers = {
        openai: 'DALL-E 3',
        replicate: 'Replicate',
        leonardo: 'Leonardo'
      };
      return providers[cloudProvider] || 'Cloud';
    }
    return 'Local SD';
  };

  const getStatusDisplay = () => {
    if (isCheckingConnection) {
      return { color: 'bg-yellow-500 animate-pulse', text: 'Checking...' };
    }
    if (mode === 'online') {
      return { color: 'bg-blue-500', text: 'Online' };
    }
    if (downloadProgress.status === 'downloading') {
      return { color: 'bg-violet-500 animate-pulse', text: `Downloading ${downloadProgress.progress.toFixed(0)}%` };
    }
    if (connectionDetails.automatic1111) {
      return { color: 'bg-green-500 animate-pulse', text: 'A1111 Ready' };
    }
    if (localModelStatus.loaded) {
      return { color: 'bg-green-500 animate-pulse', text: 'Local Ready' };
    }
    return { color: 'bg-red-500', text: 'Not Ready' };
  };

  const status = getStatusDisplay();
  const isDownloading = downloadProgress.status === 'downloading';

  const handleLoadModel = () => {
    if (!localModelStatus.loading && downloadProgress.status !== 'downloading') {
      loadLocalModel();
    }
  };

  const showLoadButton = !connectionDetails.automatic1111 && mode === 'offline' && !localModelStatus.loaded && !isDownloading;

  return (
    <header className="h-12 bg-bg-primary border-b border-border-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <h1 className="text-lg font-semibold">
          Local<span className="text-accent">Mind</span>
        </h1>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${getModeColor()}`}>
          {getModeIcon()}
          <span className="hidden sm:inline">{getProviderName()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {showLoadButton && (
          <button
            onClick={handleLoadModel}
            disabled={localModelStatus.loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-50"
            title="Load local Stable Diffusion model"
          >
            <Download className={`w-3.5 h-3.5 ${localModelStatus.loading ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Load Local Model</span>
          </button>
        )}

        {isDownloading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30">
            <div className="relative w-3.5 h-3.5">
              <Download className="w-3.5 h-3.5 text-violet-400 animate-bounce" />
            </div>
            <span className="text-xs font-mono text-violet-400">
              {downloadProgress.progress.toFixed(0)}%
            </span>
            <div className="w-16 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.progress}%` }}
              />
            </div>
          </div>
        )}

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
            className={`w-2 h-2 rounded-full ${status.color}`}
          />
          <span className="text-sm text-text-secondary hidden sm:inline">
            {status.text}
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
