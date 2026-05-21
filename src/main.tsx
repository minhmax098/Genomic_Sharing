import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Buffer } from 'buffer';
// window.Buffer = window.Buffer || Buffer;
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
(window as unknown as { global: Window }).global = window;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
