import React, { useState, useEffect } from 'react';
import './App.css';
import ACPSection from './components/ACPSection';
import AIConversation from './components/AIConversation';
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

      // Fetch the fillable PDF template
      console.log('Fetching fillable PDF template...');
      const baseUrl = window.location.pathname.endsWith('.html')
        ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))
        : window.location.pathname.replace(/\/$/, '');
      const pdfUrl = `${window.location.origin}${baseUrl}/myvoice-advancecareplanningguide-fillable.pdf`;
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

      // Get the form from the PDF
      console.log('Getting form fields...');
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      console.log(`Found ${fields.length} form fields`);

      // Get the three text fields
      const beliefsField = form.getTextField('MyBeliefsTxt');
      const valuesField = form.getTextField('MyValuesTxt');
      const wishesField = form.getTextField('MyWishesTxt');

      // Fill the fields with user input
      console.log('Filling beliefs field...');
      beliefsField.setText(beliefs);
      console.log(`Beliefs set: "${beliefs.substring(0, 50)}..."`);

      console.log('Filling values field...');
      valuesField.setText(values);
      console.log(`Values set: "${values.substring(0, 50)}..."`);

      console.log('Filling wishes field...');
      wishesField.setText(wishes);
      console.log(`Wishes set: "${wishes.substring(0, 50)}..."`);

      // Optional: Flatten the form to make fields read-only
      // Uncomment the next line if you want to prevent further editing
      // form.flatten();
      console.log('Form fields filled successfully');

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

            <AIConversation
              apiKey={apiKey}
              beliefs={beliefs}
              values={values}
              wishes={wishes}
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
