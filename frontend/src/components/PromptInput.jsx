import { useApp } from '../context/AppContext';

export default function PromptInput() {
  const { prompt, setPrompt, negativePrompt, setNegativePrompt } = useApp();
  const charCount = prompt.length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the changes you want to make..."
          className="w-full h-28 bg-bg-tertiary border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.getElementById('generate-btn')?.click();
            }
          }}
        />
        {charCount > 0 && (
          <span className="absolute bottom-2 right-3 text-xs text-text-muted">
            {charCount}
          </span>
        )}
      </div>

      <details className="group">
        <summary className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors list-none flex items-center gap-1">
          <span className="transform transition-transform group-open:rotate-90">▶</span>
          Negative prompt (optional)
        </summary>
        <div className="mt-2">
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What you don't want in the image..."
            className="w-full h-20 bg-bg-tertiary border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>
      </details>
    </div>
  );
}
