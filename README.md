# British Columbia Advanced Care Planning Guide App

A frontend-only web application to help users complete three important sections of the BC Advanced Care Planning Guide:
- **My beliefs** (what gives my life meaning)
- **My values** (what I care about in life)
- **My wishes** (for future health care treatment, life support and life-prolonging medical interventions)

## Features

- **Frontend-Only Architecture**: No backend server required - runs entirely in your browser
- **Secure API Key Management**: Your OpenAI API key is stored locally in your browser and never sent to any server except OpenAI
- **Explain Button**: Get AI-powered explanations of each section with text-to-speech
- **Record Button**: Dictate your responses using voice recording with automatic transcription
- **Smart PDF Update**: Automatically merge your responses into the official BC Advanced Care Planning Guide PDF
- **Accessible Interface**: Clean, user-friendly design that's easy to navigate

## Tech Stack

- React 18
- OpenAI API (GPT-3.5-turbo for explanations, Whisper for transcription)
- pdf-lib for client-side PDF manipulation
- Web Speech API (text-to-speech)
- MediaRecorder API (voice recording)

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
npm install
```

This will install all necessary dependencies for the React application.

### 3. Start the application

```bash
npm start
```

The app will open in your browser at http://localhost:3000

## Usage Guide

### 1. Enter Your OpenAI API Key

When you first open the app, you'll be prompted to enter your OpenAI API key:
- Enter your API key (starts with `sk-proj-...` or `sk-...`)
- Click "Save API Key"
- Your key is stored securely in your browser's localStorage
- You can change or clear your API key anytime using the buttons at the top

### 2. Explaining Sections

Click the **"Explain"** button in any section to:
- Get an AI-generated explanation of what that section means
- Hear the explanation read aloud automatically
- Click "Stop Speaking" to interrupt the audio

### 3. Recording Your Responses

Click the **"Record"** button in any section to:
1. Grant microphone permission when prompted
2. Start speaking your response
3. Click "Stop Recording" when finished
4. The app will automatically transcribe your recording and fill the field

You can also type directly into the text fields if preferred.

### 4. Updating Your Care Plan

Once all three sections are filled:
1. The "Update the Advanced Care Plan" button will become enabled
2. Click the button to generate your personalized PDF
3. Download the updated PDF with your responses included

## Browser Compatibility

- **Voice Recording**: Chrome, Edge, Firefox, Safari (requires microphone permission)
- **Text-to-Speech**: Chrome, Edge, Firefox, Safari
- **Recommended**: Latest version of Chrome or Edge for best experience

## Security & Privacy

- **No Backend Server**: Everything runs in your browser
- **API Key Security**: Your OpenAI API key is stored only in your browser's localStorage
- **No Data Collection**: No user data is sent to any server except OpenAI
- **Local Processing**: PDF generation happens entirely in your browser
- **Audio Privacy**: Audio recordings are transcribed directly by OpenAI and not stored

## Troubleshooting

### API Key Issues
- Make sure your API key is valid and active
- Check that your OpenAI account has available credits
- The key should start with `sk-proj-` or `sk-`

### Microphone Access Issues
- Ensure you've granted microphone permission to your browser
- Check your system microphone settings
- Try using HTTPS (required by some browsers for microphone access)

### Text-to-Speech Not Working
- Check browser console for errors
- Ensure your device volume is turned up
- Try a different browser if issues persist

### PDF Generation Issues
- The PDF file must be available in the public folder
- Check browser console for PDF processing errors
- Verify all three fields contain text before updating

## Project Structure

```
ACP/
├── client/                              # React frontend application
│   ├── public/
│   │   ├── index.html
│   │   └── myvoice-advancecareplanningguide.pdf  # Original PDF template
│   ├── src/
│   │   ├── components/                  # React components
│   │   │   ├── ACPSection.js           # Section component with Explain/Record
│   │   │   └── ACPSection.css
│   │   ├── App.js                       # Main app component
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── myvoice-advancecareplanningguide.pdf # Original PDF (root)
├── package.json                          # Root package.json
└── README.md
```

## Customization

### Adjusting PDF Coordinates

If the text doesn't appear in the correct location in your PDF, modify the coordinates in `client/src/App.js`:

```javascript
// Example adjustment in handleUpdatePlan function
beliefsPage.drawText(line, {
  x: 70,              // horizontal position
  y: height - 250,    // vertical position
  size: fontSize,
  // ...
});
```

### Changing AI Model

To use a different OpenAI model, edit `client/src/components/ACPSection.js`:

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

## Building for Production

To create a production build:

```bash
npm run build
```

This creates an optimized build in `client/build/` that can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Deploying to GitHub Pages

This app is configured for easy deployment to GitHub Pages.

### Quick Deploy

```bash
npm run deploy
```

This will build the app and deploy it to GitHub Pages automatically.

### First-Time Setup

1. Run the deploy command above
2. Go to your GitHub repository settings
3. Navigate to **Pages** in the sidebar
4. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click **Save**

Your app will be live at: **https://rdaudt.github.io/ACP/**

For detailed deployment instructions, troubleshooting, and configuration options, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Development

- Start development server: `npm start`
- Build for production: `npm run build`
- Deploy to GitHub Pages: `npm run deploy`
- Install dependencies: `npm install`

## License

This project is provided as-is for helping individuals complete their Advanced Care Planning Guide.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console for errors
3. Ensure all prerequisites are met
4. Verify your OpenAI API key is valid

## Acknowledgments

- British Columbia Advanced Care Planning Guide
- OpenAI for GPT and Whisper APIs
- pdf-lib for client-side PDF manipulation
