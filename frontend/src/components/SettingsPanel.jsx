import { useApp } from '../context/AppContext';
import { RefreshCw, ChevronDown } from 'lucide-react';

export default function SettingsPanel({ isOpen }) {
  const {
    settings,
    setSettings,
    models,
    currentModel,
    setModel,
    fetchModels,
    isConnected,
  } = useApp();

  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-subtle p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Generation Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="text-text-primary">Strength</label>
                <span className="text-text-muted font-mono">{settings.strength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.strength}
                onChange={(e) => handleSettingChange('strength', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1">
                How much to transform (0=identical, 1=completely new)
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="text-text-primary">Steps</label>
                <span className="text-text-muted font-mono">{settings.steps}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={settings.steps}
                onChange={(e) => handleSettingChange('steps', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1">
                Number of denoising steps (more = slower, better quality)
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="text-text-primary">Guidance Scale</label>
                <span className="text-text-muted font-mono">{settings.guidanceScale.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={settings.guidanceScale}
                onChange={(e) => handleSettingChange('guidanceScale', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1">
                How closely to follow the prompt
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="text-text-primary">Seed</label>
                <span className="text-text-muted font-mono">{settings.seed}</span>
              </div>
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => handleSettingChange('seed', parseInt(e.target.value) || -1)}
                placeholder="-1 for random"
                className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
              <p className="text-xs text-text-muted mt-1">
                Use same seed for reproducible results
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary">Model</h3>
            <button
              onClick={fetchModels}
              disabled={!isConnected}
              className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh models"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {models.length > 0 ? (
            <div className="relative">
              <select
                value={settings.model || currentModel || ''}
                onChange={(e) => {
                  handleSettingChange('model', e.target.value);
                  if (e.target.value !== currentModel) {
                    setModel(e.target.value);
                  }
                }}
                disabled={!isConnected}
                className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model.split('/').pop() || model}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              {isConnected ? 'Loading models...' : 'Connect to load models'}
            </p>
          )}
        </section>

        <section className="pt-4 border-t border-border-subtle">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Connection</h3>
          <p className="text-sm text-text-muted">
            Make sure <span className="font-mono text-text-secondary">AUTOMATIC1111</span> is running on{' '}
            <span className="font-mono text-text-secondary">localhost:7860</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-text-secondary">
              {isConnected ? 'Stable Diffusion Connected' : 'Not Connected'}
            </span>
          </div>
        </section>

        <section className="pt-4 border-t border-border-subtle">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Keyboard Shortcuts</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Generate</span>
              <kbd className="px-2 py-0.5 bg-bg-tertiary rounded text-xs font-mono text-text-secondary">
                Ctrl/Cmd + Enter
              </kbd>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
