import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 10000;
const apiKey = process.env.RENDERFUL_API_KEY;
const renderfulBase = 'https://api.renderful.ai/api/v1';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Please upload an image file.'));
    cb(null, true);
  }
});

function authHeaders() {
  return { Authorization: `Bearer ${apiKey}` };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'REX AI VIDEO backend', providerConfigured: Boolean(apiKey) });
});

app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    if (!apiKey) return res.status(503).json({ error: 'The video provider is not configured on the server yet.' });
    const prompt = String(req.body.prompt || '').trim();
    const mode = req.body.mode === 'image' ? 'image' : 'text';
    if (!prompt) return res.status(400).json({ error: 'Please enter a video description.' });
    if (mode === 'image' && !req.file) return res.status(400).json({ error: 'Please choose an image first.' });

    let imageUrl;
    if (mode === 'image') {
      const form = new FormData();
      form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || 'source-image');
      const uploadResponse = await fetch(`${renderfulBase}/uploads`, {
        method: 'POST',
        headers: authHeaders(),
        body: form
      });
      const uploadText = await uploadResponse.text();
      if (!uploadResponse.ok) return res.status(502).json({ error: `Image upload failed (${uploadResponse.status}): ${uploadText.slice(0, 500)}` });
      const uploaded = JSON.parse(uploadText);
      imageUrl = uploaded.url;
      if (!imageUrl) return res.status(502).json({ error: 'The provider did not return an image URL.' });
    }

    const payload = mode === 'image'
      ? { type: 'image-to-video', model: 'wan-2.6-i2v', image_url: imageUrl, prompt }
      : { type: 'text-to-video', model: 'wan-2.6', prompt };

    const response = await fetch(`${renderfulBase}/generations`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const raw = await response.text();
    if (!response.ok) return res.status(502).json({ error: `Video request failed (${response.status}): ${raw.slice(0, 700)}` });
    const task = JSON.parse(raw);
    if (!task.id) return res.status(502).json({ error: 'The provider did not return a generation task ID.' });
    res.json({ taskId: task.id, status: task.status || 'queued' });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Could not start video generation.' });
  }
});

app.get('/api/status/:id', async (req, res) => {
  try {
    if (!apiKey) return res.status(503).json({ error: 'The video provider is not configured on the server yet.' });
    if (!/^[a-zA-Z0-9_-]+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid task ID.' });
    const response = await fetch(`${renderfulBase}/generations/${encodeURIComponent(req.params.id)}`, {
      headers: authHeaders()
    });
    const raw = await response.text();
    if (!response.ok) return res.status(502).json({ error: `Could not check generation (${response.status}): ${raw.slice(0, 500)}` });
    const task = JSON.parse(raw);
    const outputs = Array.isArray(task.outputs) ? task.outputs : [];
    const videoUrl = outputs.find(value => typeof value === 'string' && value.startsWith('https://'))
      || task.output?.url
      || task.video_url
      || null;
    res.json({
      status: task.status,
      videoUrl,
      error: task.error || null
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message || 'Could not check video status.' });
  }
});

app.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || 'Invalid request.' });
});

app.listen(port, '0.0.0.0', () => console.log(`REX AI VIDEO backend listening on ${port}`));
