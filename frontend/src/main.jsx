import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Ticketing  from './Ticketing.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Ticketing/>
  </StrictMode>,
)
