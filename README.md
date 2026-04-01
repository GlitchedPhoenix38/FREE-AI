# LocalMind - Privacy-First AI Image Editor

A fully offline, privacy-focused AI image editing application powered by local Stable Diffusion. No data ever leaves your machine.

## Features

- **100% Offline**: No internet required after setup
- **No Login**: Works immediately without accounts
- **No Data Storage**: Images processed in memory only
- **Local AI**: Uses your local Stable Diffusion installation
- **Adjustable Settings**: Strength, steps, guidance scale, seed
- **Model Selection**: Choose from your installed models

## Prerequisites

- Python 3.9+
- Node.js 18+
- AUTOMATIC1111 Stable Diffusion WebUI running on port 7860

### AUTOMATIC1111 Setup

1. Install AUTOMATIC1111 from: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Run with API enabled:
   ```bash
   ./webui.sh --api --listen
   ```
   Or on Windows:
   ```bash
   webui-user.bat
   ```
   Add `COMMANDLINE_ARGS=--api --listen` to your user variables

## Installation

### Backend

```bash
cd backend
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

1. **Upload Image**: Click the upload area or drag & drop an image
2. **Enter Prompt**: Describe the changes you want to make
3. **Adjust Settings**: (Optional) Modify strength, steps, guidance scale
4. **Generate**: Click Generate or press Ctrl/Cmd + Enter
5. **Download**: Save the result when ready

## Settings Guide

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Strength | 0.1-1.0 | 0.75 | How much to transform (0=keep original, 1=completely new) |
| Steps | 1-50 | 25 | Quality vs speed (more steps = better quality) |
| Guidance Scale | 1-20 | 7.5 | Prompt adherence (higher = closer to prompt) |
| Seed | Any | -1 | Random seed. Set to reproduce results |

## Privacy Guarantees

- No localStorage or cookies used
- No external network requests (except to localhost)
- No analytics or telemetry
- Images processed in memory, never written to disk
- Session data cleared on refresh

## Architecture

```
frontend/          React + Vite + Tailwind
backend/           Python FastAPI
    └── routers/   Stable Diffusion API integration
    └── services/ Image processing utilities
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sd-api/status` | GET | Check Stable Diffusion connection |
| `/api/sd-api/models` | GET | List available models |
| `/api/sd-api/set-model` | POST | Change active model |
| `/api/sd-api/generate` | POST | Generate edited image (img2img) |

## Troubleshooting

### "Cannot connect to Stable Diffusion"
- Ensure AUTOMATIC1111 is running on port 7860
- Check the connection status in the header
- Click "Check" to refresh connection status

### Slow Generation
- Reduce the "Steps" setting
- Use a smaller image size
- Ensure adequate VRAM

### Out of Memory
- Use a smaller image
- Reduce resolution in AUTOMATIC1111 settings
- Close other GPU applications

## License

MIT License - Use freely for any purpose.
