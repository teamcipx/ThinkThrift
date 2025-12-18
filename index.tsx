import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Root element not found!");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Rendering error:", error);
    rootElement.innerHTML = `<div style="color: white; padding: 20px;">Critical Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
  }
}