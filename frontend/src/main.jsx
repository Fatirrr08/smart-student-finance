import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error boundary for mobile debugging
window.onerror = function(message, source, lineno) {
  // Ignore minor browser extension errors
  if (message.includes('ResizeObserver') || message.includes('Extension')) return;
  alert("APLIKASI ERROR: " + message + "\nDi: " + source + ":" + lineno);
  return false;
};

// Simple Error Boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#E11D48' }}>Ups! Terjadi kesalahan.</h1>
          <p>Aplikasi mengalami masalah saat memuat.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Muat Ulang Halaman
          </button>
          <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '20px', marginTop: '40px', overflow: 'auto', borderRadius: '8px', fontSize: '12px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
