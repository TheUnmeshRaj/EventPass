import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SatyaTicketing  from './SatyaTicketing.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SatyaTicketing/>
  </StrictMode>,
)
