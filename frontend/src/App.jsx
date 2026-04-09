import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PromptInput from './components/PromptInput';
import GenerateButton from './components/GenerateButton';
import ImagePreview from './components/ImagePreview';
import SettingsPanel from './components/SettingsPanel';
import WelcomePopup from './components/WelcomePopup';
import { AlertCircle, X } from 'lucide-react';

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { error, setError } = useApp();

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <WelcomePopup />
      
      <Header
        onSettingsClick={() => setSettingsOpen(!settingsOpen)}
        settingsOpen={settingsOpen}
      />

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="w-80 h-full bg-bg-secondary border-r border-border-subtle p-4 flex flex-col gap-6 overflow-y-auto">
          <section>
            <h2 className="text-sm font-medium text-text-secondary mb-3">Image</h2>
            <UploadZone />
          </section>

          <section>
            <h2 className="text-sm font-medium text-text-secondary mb-3">Prompt</h2>
            <PromptInput />
          </section>

          <div className="mt-auto">
            <GenerateButton />
            <p className="mt-2 text-xs text-text-muted text-center">
              All processing happens locally
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <ImagePreview />
        </div>

        <SettingsPanel isOpen={settingsOpen} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
