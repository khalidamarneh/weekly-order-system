import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Get the root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const root = createRoot(rootElement)

// Conditionally apply Strict Mode based on environment
if (import.meta.env.DEV) {
  // Development: Enable Strict Mode for debugging
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
  
  // Optional: Filter specific console errors in development
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = (...args) => {
    // Filter out 401/Unauthorized errors (optional - for cleaner console)
    if (args[0] && typeof args[0] === 'string') {
      const errorMessage = args[0].toLowerCase()
      if (errorMessage.includes('401') || 
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('strict mode')) {
        return // Silently ignore these specific errors
      }
    }
    
    // Filter React scheduler warnings (performance warnings)
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('performWorkUntilDeadline') || 
         args[0].includes('long task') ||
         args[0].includes('violation'))) {
      return // Silently ignore scheduler warnings
    }
    
    originalError.apply(console, args)
  }
  
  // Optional: Also filter warnings if needed
  console.warn = (...args) => {
    // Filter React scheduler warnings
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('performWorkUntilDeadline')) {
      return
    }
    
    originalWarn.apply(console, args)
  }
  
  // Development-only performance logging
  console.log('%c⚛️ Development Mode', 
    'color: #61dafb; font-size: 12px; font-weight: bold;')
  console.log('%c• Strict Mode: Enabled', 'color: #4CAF50')
  console.log('%c• Performance warnings may appear', 'color: #FF9800')
  
} else {
  // Production: No Strict Mode for better performance
  root.render(<App />)
  
  // Production error handling (optional)
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    // Send errors to your error tracking service
    console.error('Production error:', { msg, url, lineNo, columnNo, error })
    return false
  }
  
  // Log production mode
  console.log('%c🚀 Production Mode', 
    'color: #00C853; font-size: 12px; font-weight: bold;')
}