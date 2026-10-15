import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import './services/mockApi.js'

// El usuario de la sesión vive solo en memoria: un token que sobrevive a una recarga
// queda huérfano, así que se descarta para no hacer peticiones antes del login.
sessionStorage.removeItem('galacticappToken')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
