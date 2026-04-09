import { X, Download, WifiOff, Zap, Shield, HardDrive } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WelcomePopup() {
  const { showWelcomePopup, setShowWelcomePopup, loadLocalModel, localModelStatus, downloadProgress } = useApp();

  if (!showWelcomePopup) return null;

  const isDownloading = localModelStatus.loading || downloadProgress.status === 'downloading';
  const isComplete = downloadProgress.status === 'complete' || localModelStatus.loaded;

  const handleGetStarted = () => {
    loadLocalModel();
  };

  const handleClose = () => {
    setShowWelcomePopup(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141416] border border-[#2a2a2e] rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Welcome to LocalMind</h2>
                <p className="text-sm text-zinc-400">AI Image Editor - Offline First</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">100% Private & Secure</h3>
                <p className="text-sm text-zinc-400">All image processing happens locally on your machine. No data is ever sent to external servers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Free & Unlimited</h3>
                <p className="text-sm text-zinc-400">No API keys needed, no subscriptions, no usage limits. Generate as many images as you want.</p>
              </div>
            </div>
          </div>

          {!isComplete ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">Download Required</span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  To use offline mode, you need to download the AI model (~4GB). This is a one-time download.
                </p>
                
                {isDownloading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">Downloading...</span>
                      <span className="text-violet-400 font-mono">{downloadProgress.progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{downloadProgress.downloaded_formatted}</span>
                      <span>{downloadProgress.total_formatted}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    disabled={localModelStatus.loading}
                    className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download AI Model
                  </button>
                )}
              </div>

              {localModelStatus.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{localModelStatus.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-400">Ready to use!</span>
              </div>
              <p className="text-sm text-zinc-400">You can now generate AI images completely offline.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-black/20 border-t border-white/5">
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
