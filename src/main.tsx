import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch is writable and has setter for external extensions/interceptors
try {
  let _currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
  try {
    Object.defineProperty(window, 'fetch', {
      value: _currentFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    Object.defineProperty(window, 'fetch', {
      get() {
        return _currentFetch;
      },
      set(fn) {
        _currentFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {}


createRoot(document.getElementById('root')!).render(<App />);
