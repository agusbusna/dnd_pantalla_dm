import React from 'react'
import ReactDOM from 'react-dom/client'
import AppProviders from './context/AppProviders.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
)
