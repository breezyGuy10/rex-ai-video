import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Video, ImagePlus, WandSparkles, Download, Mic, Clapperboard } from 'lucide-react';
import './style.css';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
    setBusy(true);
    setVideoUrl('');
    try {
      setMessage('Waking up the video server…');
      const body = new FormData();
      body.append('prompt', prompt);
      body.append('quality', quality);
      body.append('voice', String(voice));
      body.append('mode', mode);
      if (mode === 'image' && image) body.append('image', image);

      const response = await fetch(`${API_BASE}/api/generate`, { method: 'POST', body });
      const started = await response.json();
      if (!response.ok) throw new Error(started.error || 'Could not start generation.');
      if (!started.taskId) throw new Error('The provider did not return a task ID.');

      setMessage('Your video is generating. This can take a few minutes…');
      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusResponse = await fetch(`${API_BASE}/api/status/${encodeURIComponent(started.taskId)}`);
        const status = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(status.error || 'Could not check generation status.');
        if (status.status === 'completed') {
          if (!status.videoUrl) throw new Error('Generation completed, but no video URL was returned.');
          setVideoUrl(status.videoUrl);
          setMessage('Your video is ready!');
          return;
        }
        if (status.status === 'failed') throw new Error(status.error || 'The video provider could not generate this video.');
        setMessage(status.status === 'queued' ? 'Your video is in the queue…' : 'Your video is being created…');
      }
      throw new Error('This video is taking longer than expected. Please try checking again in a moment.');
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
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'rex-ai-video.mp4'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      <p className="note">Video generation is powered by Renderful. Actual resolution and voice support depend on the selected model.</p>
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
