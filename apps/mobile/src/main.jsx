import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AudioProvider } from './contexts/AudioContext'
import { LAGNodeProvider } from './contexts/LAGNodeContext'

const root = createRoot(document.getElementById('root'));
root.render(
  <AudioProvider>
    <LAGNodeProvider>
      <App />
    </LAGNodeProvider>
  </AudioProvider>
);
