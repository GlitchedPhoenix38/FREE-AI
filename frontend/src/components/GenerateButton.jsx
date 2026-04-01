import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function GenerateButton() {
  const { uploadedImage, prompt, isGenerating, generateImage, isConnected } = useApp();

  const isDisabled = !uploadedImage || !prompt.trim() || isGenerating || !isConnected;

  return (
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
  );
}
