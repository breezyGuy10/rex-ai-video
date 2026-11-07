# REX AI VIDEO

A React + Vite + Capacitor starter for an Android/iOS AI video creator.

## Features in this starter
- Text-to-video and image-to-video request interface
- 720p / 1080p quality selection
- AI voice toggle passed to the generation backend
- MP4 download when the backend returns a video URL
- Responsive mobile-first interface
- GitHub Actions workflow that builds a debug Android APK

## Run locally
```bash
npm install
npm run dev
```

## Android locally
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Connect a real video generation provider
The UI expects a backend endpoint configured as `VITE_VIDEO_API_URL`. The endpoint receives multipart form data:
- `prompt`
- `quality` (720p or 1080p)
- `voice` (true/false)
- `mode` (text or image)
- `image` (optional uploaded file)

It should return JSON such as:
```json
{ "videoUrl": "https://your-host.example/video.mp4" }
```

Implement this endpoint on a server you control. Keep provider API keys on the server; never put secret keys in the app or Vite environment variables. The endpoint should validate uploads, enforce limits, handle provider polling/webhooks, and return a downloadable MP4 URL with suitable CORS headers.

This repository does not include an AI model or a free unlimited generation service. Provider pricing, available resolutions, voice support, and watermark rules depend on the service you connect.

## APK
Pushing to `main` triggers **Build Android APK** in GitHub Actions. You can also run it manually from the Actions tab. Download the `rex-ai-video-debug-apk` artifact from a successful workflow run. A debug APK is for testing; Play Store release requires a signed release build.