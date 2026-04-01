import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UploadZone() {
  const { uploadedImage, setUploadedImage, error, setError } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (PNG, JPG, WebP, BMP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [setUploadedImage, setError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  const clearImage = useCallback((e) => {
    e.stopPropagation();
    setUploadedImage(null);
  }, [setUploadedImage]);

  if (uploadedImage) {
    return (
      <div className="relative">
        <div
          className="relative rounded-xl overflow-hidden bg-bg-secondary border border-border-subtle group cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="w-full h-48 object-contain bg-bg-tertiary"
          />
          {isHovering && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-medium">Click to change</span>
            </div>
          )}
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-1.5 bg-bg-primary/80 rounded-lg hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
          onChange={handleInputChange}
          className="hidden"
          id="file-input-change"
        />
        <label
          htmlFor="file-input-change"
          className="block mt-2 text-center text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
        >
          Click image to change
        </label>
      </div>
    );
  }

  return (
    <div>
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-accent bg-accent/10'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-border-subtle hover:border-accent/50 hover:bg-bg-tertiary'
        }`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
          onChange={handleInputChange}
          className="hidden"
          id="file-input"
        />
        <div className="flex flex-col items-center gap-3">
          {isDragging ? (
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-accent" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
              <Upload className="w-6 h-6 text-text-muted" />
            </div>
          )}
          <div>
            <p className="text-text-primary font-medium">
              {isDragging ? 'Drop image here' : 'Drop image here or click to upload'}
            </p>
            <p className="text-sm text-text-muted mt-1">
              PNG, JPG, WebP, BMP supported
            </p>
          </div>
        </div>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
