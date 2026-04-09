# LocalMind - AI Image Editor (Local + Cloud)

An AI image editing application with flexible deployment options. Choose between **offline mode** (local Stable Diffusion - free, unlimited, private) or **online mode** (cloud AI - faster, higher quality).

## Features

### Offline Mode
- **100% Local**: No internet required after setup
- **No Login**: Works immediately without accounts
- **Privacy**: No data leaves your machine
- **Free & Unlimited**: No API costs or rate limits
- **Custom Models**: Use your own Stable Diffusion models

### Online Mode
- **Cloud AI**: Access powerful AI models via API
- **Faster Generation**: Cloud GPUs are typically faster
- **Higher Quality**: Access to latest models (DALL-E 3, SDXL)
- **Easy Setup**: Just add your API key

## Modes Comparison

| Aspect | Offline | Online |
|--------|---------|--------|
| Cost | Free | Pay-per-use |
| Speed | Depends on GPU | Fast (cloud GPUs) |
| Quality | Depends on model | High (latest models) |
| Privacy | Maximum | Your images sent to cloud |
| Internet | Not required | Required |

## Prerequisites

### For Offline Mode
- Python 3.9+
- Node.js 18+
- AUTOMATIC1111 Stable Diffusion WebUI on port 7860

### For Online Mode
- API key from one of the supported providers

## Supported Cloud Providers

| Provider | API Key | Best For |
|----------|---------|----------|
| OpenAI DALL-E 3 | `sk-...` | Highest quality, fast |
| Replicate (SDXL) | `r8_...` | Stable Diffusion XL |
| Leonardo.ai | `...` | Creative AI models |

## Installation

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

### Open in Browser

Navigate to: http://localhost:5173

## Usage

### Switching Modes
1. Click the **Settings** (gear icon) in the header
2. Choose **Offline** or **Online** mode
3. For online mode, enter your API key in the "API Keys" section

### Offline Mode Usage
1. Ensure AUTOMATIC1111 is running with API enabled
2. Upload an image
3. Enter your prompt
4. Adjust settings (strength, steps, guidance)
5. Select a model from your installed models
6. Click Generate

### Online Mode Usage
1. Select your cloud provider (OpenAI, Replicate, Leonardo)
2. Enter your API key in settings
3. Upload an image
4. Enter your prompt
5. Click Generate

## Settings Guide

### Offline Mode Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Strength | 0.1-1.0 | 0.75 | How much to transform (0=keep original, 1=completely new) |
| Steps | 1-50 | 25 | Quality vs speed (more steps = better quality) |
| Guidance Scale | 1-20 | 7.5 | Prompt adherence (higher = closer to prompt) |
| Seed | Any | -1 | Random seed. Set to reproduce results |

### Online Mode Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Provider | - | OpenAI | Cloud AI provider |
| API Key | - | - | Your API key for selected provider |

## Privacy & Security

### Offline Mode
- No network requests except to localhost
- No localStorage/sessionStorage usage for images
- No analytics or telemetry
- Images processed in memory only

### Online Mode
- API keys stored locally in browser only
- API keys sent only to the respective cloud provider
- Images are sent to the chosen cloud provider for processing

## Architecture

```
frontend/          React + Vite + Tailwind
    └── src/
        ├── components/   UI Components
        ├── context/      State Management
        └── hooks/        Custom Hooks

backend/           Python FastAPI
    └── routers/
        ├── sd_api.py     Local Stable Diffusion
        └── cloud_api.py  Cloud AI Providers
    └── services/
        └── image_processor.py
```

## API Endpoints

### Local SD Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sd-api/status` | GET | Check Stable Diffusion connection |
| `/api/sd-api/models` | GET | List available models |
| `/api/sd-api/set-model` | POST | Change active model |
| `/api/sd-api/generate` | POST | Generate edited image (img2img) |

### Cloud Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cloud/openai-edit` | POST | OpenAI DALL-E 3 |
| `/api/cloud/replicate` | POST | Replicate (SDXL) |
| `/api/cloud/leonardo` | POST | Leonardo.ai |

## Troubleshooting

### Offline Mode

**"Cannot connect to Stable Diffusion"**
- Ensure AUTOMATIC1111 is running on port 7860
- Check the connection status in the header
- Click "Check" to refresh connection status

**Slow Generation**
- Reduce the "Steps" setting
- Use a smaller image size
- Ensure adequate VRAM

**Out of Memory**
- Use a smaller image
- Reduce resolution in AUTOMATIC1111 settings
- Close other GPU applications

### Online Mode

**"API key not set"**
- Go to Settings
- Select Online mode
- Enter your API key in the "API Keys" section

**Generation failed**
- Check your API key is valid
- Ensure you have credits/quota with the provider
- Check the cloud service status

## AUTOMATIC1111 Setup (Offline Mode)

1. Install from: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Run with API enabled:
   ```bash
   ./webui.sh --api --listen
   ```
   Or on Windows, add `COMMANDLINE_ARGS=--api --listen` to webui-user.bat

## License

MIT License - Use freely for any purpose.
