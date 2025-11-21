import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { getCsrfToken } from './api/axiosConfig.js'

const root = createRoot(document.getElementById('root'));

// Fetch CSRF token before rendering the app
getCsrfToken().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});