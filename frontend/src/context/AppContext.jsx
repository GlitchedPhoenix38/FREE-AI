import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = '/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    strength: 0.75,
    steps: 25,
    guidanceScale: 7.5,
    seed: -1,
    model: ''
  });
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [generationParams, setGenerationParams] = useState(null);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch(`${API_BASE}/sd-api/status`);
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        if (data.current_model) {
          setCurrentModel(data.current_model);
        }
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/sd-api/models`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
        setCurrentModel(data.current);
        if (data.current && !settings.model) {
          setSettings(prev => ({ ...prev, model: data.current }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, [settings.model]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected) {
      fetchModels();
    }
  }, [isConnected, fetchModels]);

  const generateImage = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      
      const imageResponse = await fetch(uploadedImage);
      const imageBlob = await imageResponse.blob();
      formData.append('image', imageBlob, 'image.png');
      formData.append('prompt', prompt);
      formData.append('negative_prompt', negativePrompt);
      formData.append('strength', settings.strength.toString());
      formData.append('steps', settings.steps.toString());
      formData.append('guidance_scale', settings.guidanceScale.toString());
      formData.append('seed', settings.seed.toString());
      if (settings.model) {
        formData.append('model', settings.model);
      }

      const response = await fetch(`${API_BASE}/sd-api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedImage(data.image);
      setGenerationParams(data.parameters);
    } catch (err) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImage, prompt, negativePrompt, settings]);

  const setModel = useCallback(async (modelName) => {
    try {
      const response = await fetch(`${API_BASE}/sd-api/set-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `model_name=${encodeURIComponent(modelName)}`,
      });
      
      if (response.ok) {
        setCurrentModel(modelName);
        setSettings(prev => ({ ...prev, model: modelName }));
      }
    } catch (err) {
      console.error('Failed to set model:', err);
    }
  }, []);

  const value = {
    uploadedImage,
    setUploadedImage,
    generatedImage,
    setGeneratedImage,
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    isGenerating,
    error,
    setError,
    settings,
    setSettings,
    models,
    currentModel,
    isConnected,
    isCheckingConnection,
    generationParams,
    generateImage,
    checkConnection,
    fetchModels,
    setModel,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
