'use client';

import React, { useState } from 'react';

const TranquilloGuideToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-sm">
          {/* Placeholder for the actual Tranquillo Guide AI component */}
          <h3 className="text-lg font-bold mb-2">Tranquillo Guide (AI)</h3>
          <p>This is where your AI guide content will be displayed.</p>
          <p>Providing assistance and walkthroughs...</p>
        </div>
      )}
      <button
        onClick={toggleGuide}
        className="fixed bottom-4 right-4 z-50 p-3 bg-brand-green text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
        aria-label="Toggle Tranquillo Guide"
      >
        {isOpen ? 'Close Guide' : 'Open Guide'}
      </button>
    </>
  );
};

export default TranquilloGuideToggle;
