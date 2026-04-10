import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';
import FormData from 'form-data';
import url from 'url';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure Multer for image uploads
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/process-passport', upload.single('image_file'), async (req, res) => {
  try {
    const { removeBgKey, openaiKey } = process.env;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // 1. Remove Background using remove.bg
    const removeKey = removeBgKey || process.env.REMOVE_BG_KEY;
    console.log('Using Remove.bg key starting with:', removeKey ? removeKey.substring(0, 4) : 'MISSING');
    
    if (!removeKey || removeKey === 'your_key_here') {
      return res.status(401).json({ error: 'Remove.bg API key is missing or invalid. Please update server/.env' });
    }

    console.log('--- Removing Background ---');
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', uploadedFile.buffer, {
      filename: uploadedFile.originalname,
      contentType: uploadedFile.mimetype,
    });

    let removeBgRes;
    try {
      removeBgRes = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': removeKey,
        },
        responseType: 'arraybuffer',
      });
    } catch (axiosError) {
      const status = axiosError.response?.status;
      if (status === 403) {
        return res.status(403).json({ error: 'Remove.bg API key is unauthorized or quota exceeded (403).' });
      }
      throw new Error(`Remove.bg failed: ${axiosError.message}`);
    }

    const bgRemovedBase64 = Buffer.from(removeBgRes.data).toString('base64');
    const bgRemovedUrl = `data:image/png;base64,${bgRemovedBase64}`;

    res.json({
      bgRemovedUrl,
      aiData: null
    });

  } catch (error) {
    console.error('Processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for post-crop enhancement analysis
app.post('/api/enhance-passport', upload.single('image_file'), async (req, res) => {
  try {
    const { openaiKey } = process.env;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const oKey = openaiKey || process.env.OPENAI_API_KEY;
    if (!oKey || oKey === 'your_key_here') {
      return res.status(401).json({ error: 'OpenAI API key missing' });
    }

    const openai = new OpenAI({ apiKey: oKey });
    const base64Data = uploadedFile.buffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this CROPPED passport photo. 
            Recommend professional studio lighting adjustments to make it look high-end. 
            Focus on skin tone clarity and brightness.
            
            Respond STRICTLY in JSON:
            {
              "brightness": 115,
              "contrast": 110,
              "smooth": 3
            }` },
            {
              type: "image_url",
              image_url: {
                "url": `data:${uploadedFile.mimetype};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(response.choices[0].message.content));

  } catch (error) {
    console.error('Enhancement error:', error.message);
    if (error.message.includes('429')) {
      return res.status(429).json({ error: 'OpenAI API Quota Exceeded. Please add credits to your OpenAI billing account.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
