import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error boundary for mobile debugging
window.onerror = function(message, source, lineno, colno, error) {
  alert("APLIKASI ERROR: " + message + "\nDi: " + source + ":" + lineno);
  return false;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
