import React, { useState, useEffect } from 'react';
import './App.css';
import ACPSection from './components/ACPSection';
import axios from 'axios';

function App() {
  const [beliefs, setBeliefs] = useState('');
  const [values, setValues] = useState('');
  const [wishes, setWishes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Check if all sections are filled
  const allSectionsFilled = beliefs.trim() !== '' && values.trim() !== '' && wishes.trim() !== '';

  const handleUpdatePlan = async () => {
    setIsUpdating(true);
    setDownloadUrl(null);

    try {
      const response = await axios.post('/api/update-pdf', {
        beliefs,
        values,
        wishes
      }, {
        responseType: 'blob'
      });

      // Create a download URL for the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (error) {
      console.error('Error updating PDF:', error);
      alert('Failed to update the Advanced Care Plan. Please try again.');
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
        <ACPSection
          title="My beliefs (what gives my life meaning)"
          value={beliefs}
          onChange={setBeliefs}
          sectionType="beliefs"
        />

        <ACPSection
          title="My values (what I care about in life)"
          value={values}
          onChange={setValues}
          sectionType="values"
        />

        <ACPSection
          title="My wishes (for future health care treatment, life support and life-prolonging medical interventions)"
          value={wishes}
          onChange={setWishes}
          sectionType="wishes"
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
      </main>

      <footer className="App-footer">
        <p>This tool helps you complete the BC Advanced Care Planning Guide</p>
      </footer>
    </div>
  );
}

export default App;
