import React, { useState, useEffect } from 'react';
import './App.css';
import ACPSection from './components/ACPSection';
import { PDFDocument } from 'pdf-lib';

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
      // Fetch the template PDF with placeholder text
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

      let pdfBytes = await pdfResponse.arrayBuffer();
      console.log(`PDF fetched successfully (${pdfBytes.byteLength} bytes)`);

      // Function to replace text in PDF bytes
      function replacePDFText(bytes, searchText, replaceText) {
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(bytes);

        // Convert search and replace texts to bytes
        const searchBytes = new TextEncoder().encode(searchText);
        const replaceBytes = new TextEncoder().encode(replaceText);

        // Find and replace in the byte array
        const result = new Uint8Array(uint8Array);
        let modified = false;

        // Search for the pattern
        for (let i = 0; i <= result.length - searchBytes.length; i++) {
          let match = true;
          for (let j = 0; j < searchBytes.length; j++) {
            if (result[i + j] !== searchBytes[j]) {
              match = false;
              break;
            }
          }

          if (match) {
            console.log(`Found placeholder at position ${i}`);
            // Replace with new text (pad with spaces if needed)
            for (let j = 0; j < searchBytes.length; j++) {
              if (j < replaceBytes.length) {
                result[i + j] = replaceBytes[j];
              } else {
                result[i + j] = 32; // space character
              }
            }
            modified = true;
            i += searchBytes.length - 1; // Skip past this replacement
          }
        }

        if (modified) {
          console.log(`Replaced "${searchText.substring(0, 20)}..." with "${replaceText.substring(0, 20)}..."`);
        }

        return result.buffer;
      }

      // Create placeholder strings (matching the exact lengths in the PDF)
      const beliefsPlaceholder = 'a'.repeat(1562);  // Beliefs placeholder
      const valuesPlaceholder = 'b'.repeat(1278);   // Values placeholder
      const wishesPlaceholder = 'c'.repeat(1422);   // Wishes placeholder

      // Pad user text to match placeholder length
      function padText(text, targetLength) {
        if (text.length >= targetLength) {
          return text.substring(0, targetLength);
        }
        return text + ' '.repeat(targetLength - text.length);
      }

      // Replace placeholders with user input
      console.log('Replacing beliefs placeholder...');
      pdfBytes = replacePDFText(pdfBytes, beliefsPlaceholder, padText(beliefs, beliefsPlaceholder.length));

      console.log('Replacing values placeholder...');
      pdfBytes = replacePDFText(pdfBytes, valuesPlaceholder, padText(values, valuesPlaceholder.length));

      console.log('Replacing wishes placeholder...');
      pdfBytes = replacePDFText(pdfBytes, wishesPlaceholder, padText(wishes, wishesPlaceholder.length));

      // Load and save the PDF to ensure it's valid
      console.log('Loading modified PDF...');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      console.log(`PDF loaded successfully (${pdfDoc.getPageCount()} pages)`);

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
