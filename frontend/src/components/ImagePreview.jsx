import { useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ImagePreview() {
  const { uploadedImage, generatedImage, isGenerating, generationParams } = useApp();
  const [viewMode, setViewMode] = useState('side-by-side');

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `localmind_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!uploadedImage && !generatedImage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-secondary rounded-xl border border-border-subtle">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary">Upload an image to get started</p>
          <p className="text-sm text-text-muted mt-1">Your image will be processed locally</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {uploadedImage && generatedImage && (
            <div className="flex rounded-lg overflow-hidden border border-border-subtle">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setViewMode('result')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'result'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Result
              </button>
            </div>
          )}
        </div>
        {generatedImage && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-glow transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {isGenerating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-text-secondary">Generating...</p>
              <p className="text-sm text-text-muted mt-1">This may take a moment</p>
            </div>
          </div>
        ) : viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="space-y-2">
              <span className="text-xs text-text-muted font-medium">Original</span>
              <div className="rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle">
                <img
                  src={uploadedImage}
                  alt="Original"
                  className="w-full h-full object-contain max-h-[400px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-text-muted font-medium">Edited</span>
              <div className="rounded-lg overflow-hidden bg-bg-tertiary border border-border-subtle">
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-contain max-h-[400px]"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-text-muted">
                    Generated image will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === 'original' ? (
          <div className="h-full flex items-center justify-center">
            <img
              src={uploadedImage}
              alt="Original"
              className="max-w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="max-w-full max-h-[500px] object-contain rounded-lg"
              />
            ) : (
              <p className="text-text-muted">Generated image will appear here</p>
            )}
          </div>
        )}
      </div>

      {generationParams && (
        <div className="px-4 py-3 border-t border-border-subtle bg-bg-tertiary/50">
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span>Steps: <span className="text-text-secondary font-mono">{generationParams.steps}</span></span>
            <span>Guidance: <span className="text-text-secondary font-mono">{generationParams.guidance_scale}</span></span>
            <span>Strength: <span className="text-text-secondary font-mono">{generationParams.strength}</span></span>
            <span>Seed: <span className="text-text-secondary font-mono">{generationParams.seed}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
