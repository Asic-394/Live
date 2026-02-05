import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply theme immediately to prevent flash
const storedTheme = localStorage.getItem('warehouse-theme');
const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const theme = storedTheme || systemPreference;
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily disabled StrictMode - it can cause THREE.js objects to accumulate in development
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
