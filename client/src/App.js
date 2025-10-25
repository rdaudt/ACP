import React, { useState, useEffect } from 'react';
import './App.css';
import ACPSection from './components/ACPSection';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [beliefs, setBeliefs] = useState('');
  const [values, setValues] = useState('');
  const [wishes, setWishes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setShowApiKeyInput(false);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    } else {
      alert('Please enter a valid API key');
    }
  };

  const handleChangeApiKey = () => {
    setShowApiKeyInput(true);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setShowApiKeyInput(true);
  };

  // Check if all sections are filled
  const allSectionsFilled = beliefs.trim() !== '' && values.trim() !== '' && wishes.trim() !== '';

  const handleUpdatePlan = async () => {
    console.log('Starting PDF update process...');
    setIsUpdating(true);
    setDownloadUrl(null);

    try {
      // Validate input lengths (max 1262 characters each)
      const MAX_CHARS = 1262;
      const validationErrors = [];

      if (beliefs.length > MAX_CHARS) {
        validationErrors.push(`Beliefs: ${beliefs.length - MAX_CHARS} characters over the limit`);
      }
      if (values.length > MAX_CHARS) {
        validationErrors.push(`Values: ${values.length - MAX_CHARS} characters over the limit`);
      }
      if (wishes.length > MAX_CHARS) {
        validationErrors.push(`Wishes: ${wishes.length - MAX_CHARS} characters over the limit`);
      }

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        const errorMessage = `Please shorten your input:\n\n${validationErrors.join('\n')}\n\nMaximum allowed: ${MAX_CHARS} characters per section.`;
        alert(errorMessage);
        setIsUpdating(false);
        return;
      }

      // Fetch the template PDF
      console.log('Fetching PDF template...');
      const baseUrl = window.location.pathname.endsWith('.html')
        ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))
        : window.location.pathname.replace(/\/$/, '');
      const pdfUrl = `${window.location.origin}${baseUrl}/myvoice-advancecareplanningguideForEditing.pdf`;
      console.log('PDF URL:', pdfUrl);
      const pdfResponse = await fetch(pdfUrl);

      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }

      const pdfBytes = await pdfResponse.arrayBuffer();
      console.log(`PDF fetched successfully (${pdfBytes.byteLength} bytes)`);

      // Load PDF document
      console.log('Loading PDF document...');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      console.log(`PDF loaded successfully (${pdfDoc.getPageCount()} pages)`);

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

      // Page 33 (index 32): Beliefs
      if (pages.length > 32) {
        const page = pages[32];
        const { width, height } = page.getSize();

        // Draw white rectangle to cover placeholder
        page.drawRectangle({
          x: 50,
          y: height - 700,
          width: width - 100,
          height: 500,
          color: rgb(1, 1, 1),
        });

        // Draw beliefs text
        console.log('Adding beliefs to page 33...');
        const maxWidth = width - 120;
        const beliefsLines = wrapText(beliefs, maxWidth);

        beliefsLines.forEach((line, index) => {
          page.drawText(line, {
            x: 70,
            y: height - 250 - (index * lineHeight),
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        });
        console.log(`Beliefs added (${beliefsLines.length} lines)`);
      }

      // Page 34 (index 33): Values (upper) and Wishes (lower)
      if (pages.length > 33) {
        const page = pages[33];
        const { width, height } = page.getSize();
        const maxWidth = width - 120;

        // Draw white rectangle to cover placeholders (full page)
        page.drawRectangle({
          x: 50,
          y: 50,
          width: width - 100,
          height: height - 100,
          color: rgb(1, 1, 1),
        });

        // Draw values text (upper section)
        console.log('Adding values to page 34 (upper section)...');
        const valuesLines = wrapText(values, maxWidth);

        valuesLines.forEach((line, index) => {
          page.drawText(line, {
            x: 70,
            y: height - 250 - (index * lineHeight),
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        });
        console.log(`Values added (${valuesLines.length} lines)`);

        // Draw wishes text (lower section)
        console.log('Adding wishes to page 34 (lower section)...');
        const wishesLines = wrapText(wishes, maxWidth);

        wishesLines.forEach((line, index) => {
          page.drawText(line, {
            x: 70,
            y: height - 550 - (index * lineHeight),
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        });
        console.log(`Wishes added (${wishesLines.length} lines)`);
      }

      // Save the modified PDF
      console.log('Saving modified PDF...');
      const modifiedPdfBytes = await pdfDoc.save();
      console.log(`PDF saved successfully (${modifiedPdfBytes.length} bytes)`);

      // Create download URL
      console.log('Creating download URL...');
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      console.log('PDF update complete! Download URL created.');

    } catch (error) {
      console.error('Error updating PDF:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to update the Advanced Care Plan.\n\nError: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>British Columbia Advanced Care Planning Guide</h1>
        <p className="subtitle">Complete your personal beliefs, values, and wishes</p>
      </header>

      <main className="App-main">
        {showApiKeyInput ? (
          <div className="api-key-section">
            <h2>Enter Your OpenAI API Key</h2>
            <p className="api-key-info">
              This app uses OpenAI's services for explanations and transcription.
              Your API key is stored locally in your browser and never sent to any server except OpenAI.
            </p>
            <div className="api-key-input-group">
              <input
                type="password"
                className="api-key-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
              />
              <button className="api-key-button" onClick={handleSaveApiKey}>
                Save API Key
              </button>
            </div>
            <p className="api-key-help">
              Don't have an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">Get one from OpenAI</a>
            </p>
          </div>
        ) : (
          <>
            <div className="api-key-status">
              <p>API Key configured</p>
              <button className="change-api-key-button" onClick={handleChangeApiKey}>
                Change Key
              </button>
              <button className="clear-api-key-button" onClick={handleClearApiKey}>
                Clear Key
              </button>
            </div>

            <ACPSection
              title="My beliefs (what gives my life meaning)"
              value={beliefs}
              onChange={setBeliefs}
              sectionType="beliefs"
              apiKey={apiKey}
            />

            <ACPSection
              title="My values (what I care about in life)"
              value={values}
              onChange={setValues}
              sectionType="values"
              apiKey={apiKey}
            />

            <ACPSection
              title="My wishes (for future health care treatment, life support and life-prolonging medical interventions)"
              value={wishes}
              onChange={setWishes}
              sectionType="wishes"
              apiKey={apiKey}
            />

            <div className="update-section">
              <button
                className="update-button"
                onClick={handleUpdatePlan}
                disabled={!allSectionsFilled || isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update the Advanced Care Plan'}
              </button>

              {downloadUrl && (
                <div className="download-section">
                  <p className="success-message">Your Advanced Care Plan has been updated successfully!</p>
                  <a
                    href={downloadUrl}
                    download="my-advanced-care-plan.pdf"
                    className="download-link"
                  >
                    Download Updated Advanced Care Plan
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>This tool helps you complete the BC Advanced Care Planning Guide</p>
      </footer>
    </div>
  );
}

export default App;
