# LocalMind - Privacy-First AI Image Editor

## Concept & Vision

A completely offline AI image editing studio that respects user privacy above all else. No data ever leaves the machine. The interface feels like a professional creative tool—dark, focused, powerful—with the simplicity of a consumer app. Think "professional photo editor meets local AI powerhouse."

The aesthetic is **dark industrial**: deep blacks, subtle gradients, accent colors that pop without being garish. It should feel like a tool built for serious creative work, not a toy or a generic web app.

## Design Language

### Aesthetic Direction
Dark industrial workspace aesthetic inspired by professional creative software (DaVinci Resolve, Figma dark mode). High contrast for readability, subtle depth through shadows, accent colors for interactive elements.

### Color Palette
- **Background Primary**: `#0a0a0b` (near black)
- **Background Secondary**: `#141416` (card surfaces)
- **Background Tertiary**: `#1c1c1f` (elevated elements)
- **Border**: `#2a2a2e` (subtle dividers)
- **Text Primary**: `#fafafa` (high contrast)
- **Text Secondary**: `#a1a1aa` (muted)
- **Accent Primary**: `#8b5cf6` (violet-500, main actions)
- **Accent Glow**: `#a78bfa` (violet-400, hover states)
- **Success**: `#22c55e` (generation complete)
- **Error**: `#ef4444` (issues)
- **Warning**: `#f59e0b` (warnings)

### Typography
- **Headings**: Inter (bold, 600-700 weight)
- **Body**: Inter (regular, 400-500 weight)
- **Monospace**: JetBrains Mono (for technical values like dimensions)
- **Scale**: 12px (xs), 14px (sm), 16px (base), 20px (lg), 24px (xl), 32px (2xl)

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 6px (small), 8px (medium), 12px (large), 16px (cards)
- Card padding: 24px
- Gap between major sections: 32px

### Motion Philosophy
- **Transitions**: 150ms ease-out for micro-interactions, 300ms for panel transitions
- **Loading states**: Subtle pulse animation on the generate button, skeleton shimmer on image preview
- **Feedback**: Brief scale(0.98) on button press, immediate color change on hover
- **No unnecessary animation**: Professional tool feel, not playful

### Visual Assets
- Icons: Lucide React (consistent, clean line icons)
- No decorative imagery
- Placeholder states: Dashed border with icon for empty upload areas

## Layout & Structure

### Page Architecture
Single-page application with three-column layout on desktop:

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo + Connection Status + Settings Toggle              │
├──────────────────┬────────────────────────┬────────────────────┤
│                  │                        │                    │
│  Left Panel      │   Center Canvas         │   Right Panel      │
│  (Upload +       │   (Before/After        │   (Settings +      │
│   Prompt)        │    Preview)            │    Advanced)       │
│                  │                        │                    │
│  320px fixed     │   Flexible             │   320px fixed      │
│                  │                        │                    │
└──────────────────┴────────────────────────┴────────────────────┘
```

### Responsive Strategy
- **Desktop (>1024px)**: Three-column layout
- **Tablet (768-1024px)**: Two-column (left panel + canvas, settings as overlay)
- **Mobile (<768px)**: Single column, tabbed interface (Upload | Canvas | Settings)

### Visual Pacing
- Header is minimal and recedes (48px height)
- Panels have clear visual boundaries with subtle borders
- Canvas area has maximum breathing room
- Settings panel uses accordion sections to manage density

## Features & Interactions

### Core Features

#### 1. Image Upload
- **Drag & drop zone**: Large, dashed border area
- **Click to browse**: Standard file picker
- **Supported formats**: PNG, JPG, JPEG, WebP, BMP
- **Max size**: 4096x4096px (automatically resized if larger)
- **Empty state**: Upload icon + "Drop image here or click to upload"
- **With image**: Shows thumbnail with "Change" overlay on hover
- **Error state**: Red border + error message for invalid files

#### 2. Prompt Input
- **Textarea**: 3 rows default, auto-expands
- **Character counter**: Shows in corner when focused
- **Placeholder**: "Describe the changes you want to make..."
- **Submit**: Enter (without shift) or Cmd/Ctrl+Enter
- **Validation**: Cannot submit empty prompt

#### 3. Image Generation
- **Generate button**: Full width of left panel, violet accent
- **States**: 
  - Default: "Generate" with sparkle icon
  - Hover: Brighter, subtle glow
  - Loading: "Generating..." with spinner, disabled
  - Disabled: When no image or empty prompt
- **Keyboard shortcut**: Cmd/Ctrl+G to generate

#### 4. Preview Canvas
- **Split view**: Side-by-side "Original" and "Edited"
- **Toggle**: Can switch to overlay comparison with slider
- **Zoom**: Click to zoom, drag to pan, double-click to reset
- **Loading state**: Shimmer placeholder while generating
- **Empty state**: Placeholder pattern

#### 5. Download
- **Button**: Appears below edited image preview
- **Filename**: `edited_[timestamp].png`
- **Format**: PNG (preserves quality)

### Settings Panel (Advanced)

#### Generation Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| Strength | Slider | 0.1-1.0 | 0.75 | How much to transform (0=identical, 1=completely new) |
| Steps | Slider | 1-50 | 25 | Number of denoising steps |
| Guidance Scale | Slider | 1-20 | 7.5 | How closely to follow prompt |
| Seed | Number | Any | -1 (random) | For reproducible results |

#### Model Selection
- Dropdown with available models from Stable Diffusion
- Shows currently loaded model
- "Refresh Models" button to reload list

#### Connection Settings
- AUTOMATIC1111 URL (default: `http://localhost:7860`)
- Connection status indicator (green dot = connected, red = disconnected)
- "Test Connection" button

### Error Handling
- **No image**: "Please upload an image first"
- **Empty prompt**: "Please enter a prompt"
- **API not connected**: "Cannot connect to Stable Diffusion. Make sure AUTOMATIC1111 is running."
- **Generation failed**: "Generation failed: [error message]"
- **Invalid file type**: "Please upload a valid image (PNG, JPG, WebP)"

### Edge Cases
- **Large image**: Auto-resize to max 4096px, show notification
- **Long generation**: Show progress bar if available, timeout at 300s
- **Browser refresh**: Clear all state (no persistence)
- **Network issues**: Reconnection logic with exponential backoff

## Component Inventory

### Header
- Height: 48px
- Background: `#0a0a0b` with bottom border `#2a2a2e`
- Logo: "LocalMind" in Inter Bold + violet accent on icon
- Connection status: Dot + text, positioned right
- Settings gear: Opens settings panel

### UploadZone
- Default: Dashed border `#2a2a2e`, rounded-lg, centered content
- Hover: Border becomes `#8b5cf6`, background `#141416`
- Drag over: Solid violet border, pulsing background
- Has image: Shows image thumbnail, "Change" on hover
- Error: Red dashed border, error message below

### PromptInput
- Textarea with `#1c1c1f` background, `#2a2a2e` border
- Focus: `#8b5cf6` border
- Placeholder in `#71717a`

### GenerateButton
- Full width, 48px height
- Background: `#8b5cf6`, text white
- Hover: `#a78bfa` background, subtle box-shadow glow
- Loading: Spinner + "Generating...", opacity 0.8
- Disabled: `#3f3f46` background, `#71717a` text, cursor not-allowed

### ImagePreview
- Card with `#141416` background, rounded-xl
- Label: "Original" / "Edited" in top-left corner
- Image: `object-contain`, max-height calculated from viewport
- Loading: Shimmer animation overlay

### SettingsPanel
- Accordion sections with `#1c1c1f` headers
- Sliders: Custom styled, violet track
- Inputs: Dark background, subtle border
- Dropdown: Custom styled select

### ConnectionIndicator
- Dot: 8px circle
- Connected: `#22c55e` with subtle pulse
- Disconnected: `#ef4444`
- Connecting: `#f59e0b` with spin animation

## Technical Approach

### Frontend Stack
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API (native)
- **State**: React useState/useContext (no external state library)

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── UploadZone.jsx
│   │   ├── PromptInput.jsx
│   │   ├── GenerateButton.jsx
│   │   ├── ImagePreview.jsx
│   │   ├── SettingsPanel.jsx
│   │   └── ConnectionIndicator.jsx
│   ├── hooks/
│   │   └── useStableDiffusion.js
│   ├── context/
│   │   └── AppContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Backend Stack
- **Framework**: Python FastAPI
- **Image Processing**: Pillow
- **File Handling**: python-multipart
- **CORS**: Enabled for localhost development
- **Static Files**: Serves generated images

### Backend Structure
```
backend/
├── main.py              # FastAPI app entry point
├── routers/
│   └── sd_api.py        # Stable Diffusion API router
├── services/
│   └── image_processor.py  # Image resizing, validation
├── requirements.txt
└── README.md            # Setup instructions
```

### API Design

#### POST `/api/generate`
Generate edited image using img2img.

**Request**: `multipart/form-data`
```
- image: File (required)
- prompt: string (required)
- strength: float (0.1-1.0, default 0.75)
- steps: int (1-50, default 25)
- guidance_scale: float (1-20, default 7.5)
- seed: int (-1 for random, default -1)
- model: string (model name, optional)
```

**Response**: 
```json
{
  "success": true,
  "image": "data:image/png;base64,...",
  "seed": 12345,
  "parameters": {...}
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

#### GET `/api/models`
Get available Stable Diffusion models.

**Response**:
```json
{
  "models": ["model1.safetensors", "model2.safetensors"],
  "current": "model1.safetensors"
}
```

#### GET `/api/status`
Check connection to Stable Diffusion.

**Response**:
```json
{
  "connected": true,
  "sd_version": "v1.6",
  "url": "http://localhost:7860"
}
```

#### POST `/api/set-model`
Change the active model.

**Request**:
```json
{
  "model": "model_name"
}
```

**Response**:
```json
{
  "success": true,
  "model": "model_name"
}
```

### Data Flow
1. User uploads image → stored in React state as base64
2. User enters prompt + settings
3. Generate button clicked → POST to `/api/generate` with image + params
4. Backend receives request, validates image, sends to Stable Diffusion
5. Stable Diffusion returns generated image
6. Backend returns base64 image to frontend
7. Frontend displays result, enables download

### Privacy Guarantees
- No localStorage/sessionStorage usage
- No cookies
- No network requests except to localhost
- No analytics or telemetry
- No logs of user content
- Images processed in memory, not persisted to disk (except temp)

## Development Notes

### Prerequisites
- Python 3.9+
- Node.js 18+
- AUTOMATIC1111 Stable Diffusion WebUI running on port 7860
- At least 8GB RAM, 6GB VRAM recommended

### Running the App
1. Start backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm install && npm run dev`
3. Open http://localhost:5173

### Environment Variables (Backend)
- `SD_API_URL`: Stable Diffusion URL (default: http://localhost:7860)
