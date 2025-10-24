const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API Routes

// Explain endpoint - Gets explanation from LLM
app.post('/api/explain', async (req, res) => {
  try {
    const { prompt, sectionType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Getting explanation for ${sectionType}...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate healthcare assistant helping people complete their Advanced Care Planning Guide. Provide clear, empathetic, and practical explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const explanation = completion.choices[0].message.content;

    res.json({ explanation });

  } catch (error) {
    console.error('Error getting explanation:', error);
    res.status(500).json({
      error: 'Failed to get explanation',
      details: error.message
    });
  }
});

// Transcribe endpoint - Converts audio to text using Whisper
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { sectionType } = req.body;
    console.log(`Transcribing audio for ${sectionType}...`);

    // Read the uploaded file
    const audioFile = await fs.readFile(req.file.path);

    // Create a File object for OpenAI
    const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en'
    });

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({ transcript: transcription.text });

  } catch (error) {
    console.error('Error transcribing audio:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

// Update PDF endpoint - Merges user input into PDF
app.post('/api/update-pdf', async (req, res) => {
  try {
    const { beliefs, values, wishes } = req.body;

    if (!beliefs || !values || !wishes) {
      return res.status(400).json({ error: 'All sections are required' });
    }

    console.log('Updating PDF with user content...');

    // Load the original PDF
    const pdfPath = path.join(__dirname, '../myvoice-advancecareplanningguide.pdf');
    const existingPdfBytes = await fs.readFile(pdfPath);

    // Load PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const lineHeight = 12;

    // Helper function to wrap text
    function wrapText(text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    }

    // Get pages
    const pages = pdfDoc.getPages();

    // Find appropriate pages and positions to add content
    // Note: These coordinates are estimates and may need adjustment based on the actual PDF structure
    // Page 0 is typically the cover, so we'll start from page 1

    if (pages.length > 2) {
      // Add Beliefs to page 3 (index 2)
      const beliefsPage = pages[2];
      const { height } = beliefsPage.getSize();
      const maxWidth = 450;
      const beliefsLines = wrapText(beliefs, maxWidth);

      beliefsLines.forEach((line, index) => {
        beliefsPage.drawText(line, {
          x: 70,
          y: height - 250 - (index * lineHeight),
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
      });
    }

    if (pages.length > 3) {
      // Add Values to page 4 (index 3)
      const valuesPage = pages[3];
      const { height } = valuesPage.getSize();
      const maxWidth = 450;
      const valuesLines = wrapText(values, maxWidth);

      valuesLines.forEach((line, index) => {
        valuesPage.drawText(line, {
          x: 70,
          y: height - 250 - (index * lineHeight),
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
      });
    }

    if (pages.length > 4) {
      // Add Wishes to page 5 (index 4)
      const wishesPage = pages[4];
      const { height } = wishesPage.getSize();
      const maxWidth = 450;
      const wishesLines = wrapText(wishes, maxWidth);

      wishesLines.forEach((line, index) => {
        wishesPage.drawText(line, {
          x: 70,
          y: height - 250 - (index * lineHeight),
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
      });
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Send the PDF back
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=my-advanced-care-plan.pdf');
    res.send(Buffer.from(pdfBytes));

    console.log('PDF updated successfully');

  } catch (error) {
    console.error('Error updating PDF:', error);
    res.status(500).json({
      error: 'Failed to update PDF',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. Please add it to your .env file.');
  }
});

module.exports = app;
