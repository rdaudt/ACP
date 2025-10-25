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
      // Fetch the original PDF
      console.log('Fetching PDF template...');
      // Construct the PDF URL based on the current page location
      const baseUrl = window.location.pathname.endsWith('.html')
        ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))
        : window.location.pathname.replace(/\/$/, '');
      const pdfUrl = `${window.location.origin}${baseUrl}/myvoice-advancecareplanningguide.pdf`;
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

      // Add content to appropriate pages
      // Page 33: Beliefs
      // Page 34: Values (upper section) and Wishes (lower section)

      if (pages.length > 32) {
        // Add Beliefs to page 33 (index 32)
        // Text goes below "My beliefs (what gives my life meaning)"
        console.log('Adding beliefs to page 33...');
        const beliefsPage = pages[32];
        const maxWidth = 450;
        const beliefsLines = wrapText(beliefs, maxWidth);

        beliefsLines.forEach((line, index) => {
          beliefsPage.drawText(line, {
            x: 70,
            y: 520 - (index * lineHeight),  // Adjusted Y position for beliefs section
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        });
        console.log(`Beliefs added (${beliefsLines.length} lines)`);
      }

      if (pages.length > 33) {
        // Add Values to page 34 (index 33) - upper section
        // Text goes below "My values (what I care about in my life)"
        console.log('Adding values to page 34 (upper section)...');
        const valuesPage = pages[33];
        const maxWidth = 450;
        const valuesLines = wrapText(values, maxWidth);

        valuesLines.forEach((line, index) => {
          valuesPage.drawText(line, {
            x: 70,
            y: 550 - (index * lineHeight),  // Adjusted Y position for values section (upper)
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
        });
        console.log(`Values added (${valuesLines.length} lines)`);

        // Add Wishes to page 34 (index 33) - lower section
        // Text goes below "My wishes (for future health care treatment...)"
        console.log('Adding wishes to page 34 (lower section)...');
        const wishesLines = wrapText(wishes, maxWidth);

        wishesLines.forEach((line, index) => {
          valuesPage.drawText(line, {
            x: 70,
            y: 310 - (index * lineHeight),  // Adjusted Y position for wishes section (lower)
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
