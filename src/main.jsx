import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { Video, ImagePlus, WandSparkles, Download, Mic, Clapperboard } from 'lucide-react';
import './style.css';

function App() {
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [voice, setVoice] = useState(true);
  const [quality, setQuality] = useState('1080p');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Your generated video will appear here.');
  const [videoUrl, setVideoUrl] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return setMessage('Please enter a video description.');
    if (mode === 'image' && !image) return setMessage('Please choose an image first.');
    const endpoint = import.meta.env.VITE_VIDEO_API_URL;
    if (!endpoint) return setMessage('Video generation is not connected yet. Add VITE_VIDEO_API_URL in your deployment secrets and connect a compatible AI video API.');
    setBusy(true);
    setMessage('Sending your request…');
    setVideoUrl('');
    try {
      const body = new FormData();
      body.append('prompt', prompt);
      body.append('quality', quality);
      body.append('voice', String(voice));
      body.append('mode', mode);
      if (image) body.append('image', image);
      const response = await fetch(endpoint, { method: 'POST', body });
      if (!response.ok) throw new Error(await response.text() || 'Generation request failed');
      const data = await response.json();
      if (!data.videoUrl) throw new Error('The API response did not include videoUrl.');
      setVideoUrl(data.videoUrl);
      setMessage('Your video is ready!');
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'rex-ai-video.mp4'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, '_blank');
    }
  };

  return <main className="shell">
    <header className="topbar"><div className="brandmark"><Clapperboard size={22}/></div><div><strong>REX AI VIDEO</strong><small>YOUR AI VIDEO STUDIO</small></div><span className="beta">BETA</span></header>
    <section className="hero"><div className="eyebrow">CREATE • IMAGINE • SHARE</div><h1>Turn your ideas<br/><span>into videos.</span></h1><p>Create videos from a text prompt or an image. Your next story starts here.</p></section>
    <section className="panel">
      <div className="section-title"><WandSparkles size={18}/> <h2>Create a video</h2></div>
      <div className="tabs">
        <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}><Video size={17}/> Text to video</button>
        <button className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}><ImagePlus size={17}/> Image to video</button>
      </div>
      <label className="field-label" htmlFor="prompt">Describe your video</label>
      <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A cinematic shot of a futuristic city at sunset, flying cars, glowing lights…" rows="4"/>
      {mode === 'image' && <label className="upload"><ImagePlus size={20}/><span>{image ? image.name : 'Choose an image to animate'}</span><input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)}/></label>}
      <div className="options">
        <div><label className="field-label" htmlFor="quality">Video quality</label><select id="quality" value={quality} onChange={e => setQuality(e.target.value)}><option>720p</option><option>1080p</option></select></div>
        <label className="voice-toggle"><span><Mic size={17}/> AI voice</span><input type="checkbox" checked={voice} onChange={e => setVoice(e.target.checked)}/></label>
      </div>
      <button className="generate" onClick={generate} disabled={busy}><WandSparkles size={18}/>{busy ? 'Working…' : 'Generate video'}</button>
      <p className="note">Generation requires a connected AI video service. Quality and voice availability depend on that provider.</p>
    </section>
    <section className="result">
      <div className="section-title"><Video size={18}/><h2>Your video</h2></div>
      {videoUrl ? <video className="player" src={videoUrl} controls playsInline/> : <div className="placeholder"><div className="play"><Video size={26}/></div><p>{message}</p></div>}
      {videoUrl && <button className="download" onClick={download}><Download size={17}/> Download MP4</button>}
      {!videoUrl && <p className="status">{message}</p>}
    </section>
    <footer>Made for creators <span>•</span> REX AI VIDEO</footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<App/>);