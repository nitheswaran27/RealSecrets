import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import nhLogo from './assets/nhlogo.webp'

// The supplied logo includes a large black margin. Crop only that margin before
// the browser reduces it to tab-icon size; the visible artwork stays unchanged.
const faviconImage = new Image()
faviconImage.onload = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64

  const context = canvas.getContext('2d')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(faviconImage, 128, 112, 544, 544, 0, 0, 64, 64)

  const favicon = document.querySelector('link[rel="icon"]')
  favicon.href = canvas.toDataURL('image/png')
  favicon.type = 'image/png'
}
faviconImage.src = nhLogo

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
