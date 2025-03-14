import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Define a global mountReactApp function that can be called from the extension
window.mountReactApp = container => {
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  return root
}
