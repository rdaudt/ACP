# British Columbia Advanced Care Planning Guide App

A web application to help users complete three important sections of the BC Advanced Care Planning Guide:
- **My beliefs** (what gives my life meaning)
- **My values** (what I care about in life)
- **My wishes** (for future health care treatment, life support and life-prolonging medical interventions)

## Features

- **Explain Button**: Get AI-powered explanations of each section with text-to-speech
- **Record Button**: Dictate your responses using voice recording with automatic transcription
- **Smart PDF Update**: Automatically merge your responses into the official BC Advanced Care Planning Guide PDF
- **Accessible Interface**: Clean, user-friendly design that's easy to navigate

## Tech Stack

### Frontend
- React 18
- Web Speech API (text-to-speech)
- MediaRecorder API (voice recording)
- Axios for API calls

### Backend
- Node.js with Express
- OpenAI API (GPT-3.5-turbo for explanations, Whisper for transcription)
- pdf-lib for PDF manipulation
- Multer for file uploads

## Prerequisites

- Node.js 16+ and npm
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Modern web browser with microphone access

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ACP
```

### 2. Install dependencies

```bash
npm run install-all
```

This will install dependencies for both the client and server.

### 3. Set up environment variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:

```
PORT=5000
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Running the Application

### Development Mode

From the root directory, run both client and server simultaneously:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Running Separately

**Start the backend:**
```bash
npm run server
```

**Start the frontend:**
```bash
npm run client
```

## Usage Guide

### 1. Explaining Sections

Click the **"Explain"** button in any section to:
- Get an AI-generated explanation of what that section means
- Hear the explanation read aloud automatically
- Click "Stop Speaking" to interrupt the audio

### 2. Recording Your Responses

Click the **"Record"** button in any section to:
1. Grant microphone permission when prompted
2. Start speaking your response
3. Click "Stop Recording" when finished
4. The app will automatically transcribe your recording and fill the field

You can also type directly into the text fields if preferred.

### 3. Updating Your Care Plan

Once all three sections are filled:
1. The "Update the Advanced Care Plan" button will become enabled
2. Click the button to generate your personalized PDF
3. Download the updated PDF with your responses included

## Browser Compatibility

- **Voice Recording**: Chrome, Edge, Firefox, Safari (requires microphone permission)
- **Text-to-Speech**: Chrome, Edge, Firefox, Safari
- **Recommended**: Latest version of Chrome or Edge for best experience

## Troubleshooting

### Microphone Access Issues
- Ensure you've granted microphone permission to your browser
- Check your system microphone settings
- Try using HTTPS (required by some browsers for microphone access)

### Text-to-Speech Not Working
- Check browser console for errors
- Ensure your device volume is turned up
- Try a different browser if issues persist

### API Errors
- Verify your OpenAI API key is correctly set in `server/.env`
- Check your OpenAI account has available credits
- Review server logs for detailed error messages

### PDF Generation Issues
- Ensure the `myvoice-advancecareplanningguide.pdf` file is in the root directory
- Check server logs for PDF processing errors
- Verify all three fields contain text before updating

## Project Structure

```
ACP/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ACPSection.js
│   │   │   └── ACPSection.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                # Node.js backend
│   ├── server.js         # Express server
│   ├── .env.example      # Environment template
│   └── package.json
├── myvoice-advancecareplanningguide.pdf  # Original PDF template
├── package.json          # Root package.json
└── README.md
```

## API Endpoints

### POST /api/explain
Get AI explanation for a section
```json
{
  "prompt": "explanation request",
  "sectionType": "beliefs|values|wishes"
}
```

### POST /api/transcribe
Transcribe audio recording
- Form data with 'audio' file and 'sectionType'

### POST /api/update-pdf
Generate updated PDF with user content
```json
{
  "beliefs": "user beliefs text",
  "values": "user values text",
  "wishes": "user wishes text"
}
```

### GET /api/health
Health check endpoint

## Security Considerations

- Never commit your `.env` file with API keys
- Keep your OpenAI API key secure
- Review OpenAI usage and billing regularly
- Audio files are automatically deleted after transcription
- No user data is stored permanently on the server

## Customization

### Adjusting PDF Coordinates

If the text doesn't appear in the correct location in your PDF, modify the coordinates in `server/server.js`:

```javascript
// Example adjustment
beliefsPage.drawText(line, {
  x: 70,        // horizontal position
  y: height - 250,  // vertical position
  size: fontSize,
  // ...
});
```

### Changing AI Model

To use a different OpenAI model, edit `server/server.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4',  // Change model here
  // ...
});
```

## Cost Considerations

This app uses OpenAI's paid APIs:
- **GPT-3.5-turbo**: ~$0.002 per explanation
- **Whisper**: ~$0.006 per minute of audio

Typical usage per user:
- 3 explanations: ~$0.006
- 3 recordings (2 min each): ~$0.036
- **Total: ~$0.04 per complete session**

## License

This project is provided as-is for helping individuals complete their Advanced Care Planning Guide.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console for errors
3. Check server logs for backend issues
4. Ensure all prerequisites are met

## Acknowledgments

- British Columbia Advanced Care Planning Guide
- OpenAI for GPT and Whisper APIs
- pdf-lib for PDF manipulation
