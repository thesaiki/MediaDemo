import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import CloudinaryApp from './CloudinaryApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudinaryApp />
  </StrictMode>,
)
