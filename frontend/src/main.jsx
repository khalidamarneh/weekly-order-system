import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Add this in your main App.jsx or index.js for development only
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out 401 errors from fetch
    if (args[0] && args[0].includes && 
        (args[0].includes('401') || args[0].includes('Unauthorized'))) {
      return;
    }
    originalError.apply(console, args);
  };
}