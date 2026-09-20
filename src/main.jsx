import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import './styles/global.css'
import './styles/app.css'
import './styles/gate.css'
import './styles/sign.css'
import './styles/chronicle.css'
import './styles/poetry.css'
import './styles/comments.css'
import './styles/history.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
