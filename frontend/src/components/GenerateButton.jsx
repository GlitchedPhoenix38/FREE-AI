import { Sparkles, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function GenerateButton() {
  const { uploadedImage, prompt, isGenerating, generateImage, isConnected, mode, apiKeys, cloudProvider, localModelStatus, connectionDetails } = useApp();

  const hasRequiredApiKey = mode === 'offline' || (mode === 'online' && apiKeys[cloudProvider]);

  const getDisabledReason = () => {
    if (!uploadedImage) return 'Upload an image first';
    if (!prompt.trim()) return 'Enter a prompt';
    if (isGenerating) return 'Generating...';
    if (mode === 'offline' && !isConnected) return 'Load local model first';
    if (mode === 'online' && !apiKeys[cloudProvider]) return `Add ${cloudProvider} API key`;
    return null;
  };

  const disabledReason = getDisabledReason();
  const isDisabled = !!disabledReason;

  const showOfflineHelp = mode === 'offline' && !isConnected;

  return (
    <div className="space-y-2">
      <button
        id="generate-btn"
        onClick={generateImage}
        disabled={isDisabled}
        className={`w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
          isDisabled
            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            : 'bg-accent text-white hover:bg-accent-glow hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
        {mode === 'online' ? (
          <>
            <Wifi className="w-3 h-3 text-blue-400" />
            <span>Cloud mode - requires API key</span>
          </>
        ) : showOfflineHelp ? (
          <>
            <WifiOff className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400/80">Click "Load Local Model" in header</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-green-400" />
            <span>Local mode - free & private</span>
          </>
        )}
      </div>
    </div>
  );
}
