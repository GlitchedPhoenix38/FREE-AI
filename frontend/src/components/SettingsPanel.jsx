import { useApp } from '../context/AppContext';
import { RefreshCw, ChevronDown, Key, Wifi, WifiOff, Globe } from 'lucide-react';

export default function SettingsPanel({ isOpen }) {
  const {
    settings,
    setSettings,
    models,
    currentModel,
    setModel,
    fetchModels,
    isConnected,
    mode,
    setMode,
    cloudProvider,
    setCloudProvider,
    apiKeys,
    saveApiKey,
  } = useApp();

  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const cloudProviders = [
    { id: 'openai', name: 'OpenAI DALL-E 3', description: 'High quality, fast' },
    { id: 'replicate', name: 'Replicate (SDXL)', description: 'Stable Diffusion XL' },
    { id: 'leonardo', name: 'Leonardo.ai', description: 'Creative AI models' },
  ];

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-subtle p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('offline')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                mode === 'offline'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-subtle hover:border-accent/50'
              }`}
            >
              <WifiOff className="w-5 h-5" />
              <span className="text-sm font-medium">Offline</span>
              <span className="text-xs opacity-70">Local SD</span>
            </button>
            <button
              onClick={() => setMode('online')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                mode === 'online'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-subtle hover:border-accent/50'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">Online</span>
              <span className="text-xs opacity-70">Cloud AI</span>
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {mode === 'offline'
              ? 'Uses local Stable Diffusion - free, unlimited, private'
              : 'Uses cloud AI - faster, higher quality, requires API key'}
          </p>
        </section>

        {mode === 'online' && (
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Cloud Provider</h3>
            <div className="space-y-2">
              {cloudProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setCloudProvider(provider.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    cloudProvider === provider.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border-subtle hover:border-accent/50'
                  }`}
                >
                  <div className="font-medium text-sm">{provider.name}</div>
                  <div className="text-xs text-text-muted">{provider.description}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {mode === 'online' && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text-secondary">API Keys</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-primary mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => saveApiKey('openai', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">
                  Replicate API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.replicate}
                  onChange={(e) => saveApiKey('replicate', e.target.value)}
                  placeholder="r8_..."
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">
                  Leonardo.ai API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.leonardo}
                  onChange={(e) => saveApiKey('leonardo', e.target.value)}
                  placeholder="..."
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <p className="text-xs text-text-muted">
                Keys are stored locally in your browser only.
              </p>
            </div>
          </section>
        )}

        {mode === 'offline' && (
          <>
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
                    More steps = better quality, slower
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
          </>
        )}

        <section className="pt-4 border-t border-border-subtle">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Local Connection</h3>
          <p className="text-sm text-text-muted">
            Make sure <span className="font-mono text-text-secondary">AUTOMATIC1111</span> is running on{' '}
            <span className="font-mono text-text-secondary">localhost:7860</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-text-secondary">
              {isConnected ? 'Connected' : 'Not Connected'}
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
