import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const API_BASE = '/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('offline');
  const [cloudProvider, setCloudProvider] = useState('openai');
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('api_key_openai') || '',
    replicate: localStorage.getItem('api_key_replicate') || '',
    leonardo: localStorage.getItem('api_key_leonardo') || '',
  });
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
  const [localModelStatus, setLocalModelStatus] = useState({
    loaded: false,
    loading: false,
    error: null
  });
  const [downloadProgress, setDownloadProgress] = useState({
    status: 'idle',
    progress: 0,
    downloaded: 0,
    total: 0,
    downloaded_formatted: '0 B',
    total_formatted: '0 B'
  });
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState({
    automatic1111: false,
    local: false
  });
  
  const hasCheckedInitialConnection = useRef(false);

  const saveApiKey = useCallback((provider, key) => {
    localStorage.setItem(`api_key_${provider}`, key);
    setApiKeys(prev => ({ ...prev, [provider]: key }));
  }, []);

  const loadLocalModel = useCallback(async () => {
    setLocalModelStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/sd-api/load-local-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'model_path=runwayml/stable-diffusion-v1-5'
      });
      
      const data = await response.json();
      
      if (data.success && !data.loading) {
        setLocalModelStatus({ loaded: true, loading: false, error: null });
      } else if (data.loading) {
        setLocalModelStatus({ loaded: false, loading: true, error: null });
      } else {
        setLocalModelStatus({ loaded: false, loading: false, error: data.message || 'Failed to load model' });
      }
    } catch (err) {
      setLocalModelStatus({ loaded: false, loading: false, error: err.message });
    }
  }, []);

  const fetchDownloadProgress = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/sd-api/download-progress`);
      if (response.ok) {
        const data = await response.json();
        setDownloadProgress(data);
        
        if (data.status === 'complete' && !localModelStatus.loaded) {
          setLocalModelStatus({ loaded: true, loading: false, error: null });
        }
      }
    } catch (err) {
      console.error('Failed to fetch download progress:', err);
    }
  }, [localModelStatus.loaded]);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch(`${API_BASE}/sd-api/status`);
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setConnectionDetails({
          automatic1111: data.automatic1111 || false,
          local: data.local || false
        });
        
        if (data.download) {
          setDownloadProgress(data.download);
          if (data.download.status === 'complete') {
            setLocalModelStatus({ loaded: true, loading: false, error: null });
          }
        }
        
        if (data.current_model) {
          setCurrentModel(data.current_model);
        }
        
        if (data.local_loaded) {
          setLocalModelStatus({ loaded: true, loading: false, error: null });
        }
        
        if (!hasCheckedInitialConnection.current) {
          hasCheckedInitialConnection.current = true;
          if (!data.connected && !data.local_loaded) {
            setShowWelcomePopup(true);
          }
        }
      } else {
        setIsConnected(false);
        setConnectionDetails({ automatic1111: false, local: false });
        
        if (!hasCheckedInitialConnection.current) {
          hasCheckedInitialConnection.current = true;
          setShowWelcomePopup(true);
        }
      }
    } catch (err) {
      setIsConnected(false);
      setConnectionDetails({ automatic1111: false, local: false });
      
      if (!hasCheckedInitialConnection.current) {
        hasCheckedInitialConnection.current = true;
        setShowWelcomePopup(true);
      }
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
    if (localModelStatus.loading || (downloadProgress.status === 'downloading')) {
      const progressInterval = setInterval(fetchDownloadProgress, 1000);
      return () => clearInterval(progressInterval);
    }
  }, [localModelStatus.loading, downloadProgress.status, fetchDownloadProgress]);

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

    if (mode === 'offline' && !isConnected) {
      setError('No AI backend connected. Click "Load Local Model" to start offline generation.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (mode === 'online') {
        await generateOnline();
      } else {
        await generateOffline();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [mode, uploadedImage, prompt, negativePrompt, settings, apiKeys, cloudProvider, isConnected]);

  const generateOffline = useCallback(async () => {
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
  }, [uploadedImage, prompt, negativePrompt, settings]);

  const generateOnline = useCallback(async () => {
    const imageResponse = await fetch(uploadedImage);
    const imageBlob = await imageResponse.blob();
    const base64Image = await blobToBase64(imageBlob);

    let endpoint, payload, headers;

    switch (cloudProvider) {
      case 'openai':
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not set. Please add it in settings.');
        }
        endpoint = `${API_BASE}/cloud/openai-edit`;
        payload = {
          image: base64Image,
          prompt: prompt,
          n: 1,
          size: '1024x1024'
        };
        headers = { 'X-API-Key': apiKeys.openai };
        break;

      case 'replicate':
        if (!apiKeys.replicate) {
          throw new Error('Replicate API key not set. Please add it in settings.');
        }
        endpoint = `${API_BASE}/cloud/replicate`;
        headers = { 'X-API-Key': apiKeys.replicate };
        payload = {
          image: base64Image,
          prompt: prompt,
          strength: settings.strength
        };
        break;

      case 'leonardo':
        if (!apiKeys.leonardo) {
          throw new Error('Leonardo.ai API key not set. Please add it in settings.');
        }
        endpoint = `${API_BASE}/cloud/leonardo`;
        headers = { 'X-API-Key': apiKeys.leonardo };
        payload = {
          image: base64Image,
          prompt: prompt,
          strength: settings.strength,
          modelId: 'ac3cf714-f9b8-450e-a5e8-91f63ed6c7a3'
        };
        break;

      default:
        throw new Error('Unknown cloud provider');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Cloud generation failed');
    }

    const data = await response.json();
    setGeneratedImage(data.image);
    setGenerationParams({
      provider: cloudProvider,
      model: cloudProvider,
      ...data.parameters
    });
  }, [uploadedImage, prompt, settings, apiKeys, cloudProvider]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

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
    mode,
    setMode,
    cloudProvider,
    setCloudProvider,
    apiKeys,
    saveApiKey,
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
    loadLocalModel,
    localModelStatus,
    connectionDetails,
    downloadProgress,
    setDownloadProgress,
    showWelcomePopup,
    setShowWelcomePopup,
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
