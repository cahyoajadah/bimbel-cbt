import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { getCsrfToken } from './api/axiosConfig.js'
import 'katex/dist/katex.min.css';

// [FIX] Menyembunyikan warning "findDOMNode" yang berasal dari library React Quill
// Warning ini muncul karena library tersebut belum update ke React 18, tapi aman untuk diabaikan.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  originalConsoleError(...args);
};

const root = createRoot(document.getElementById('root'));

// Fetch CSRF token before rendering the app
getCsrfToken().then(() => {
  root.render(
    <App />
  )
});