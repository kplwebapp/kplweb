import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './styles/pageHeading.scss'
import App from './App'
import { initFontScale } from './utils/fontScale'
import { installRequiredFieldHighlight } from './utils/requiredFieldHighlight'
import { installTabIndicator } from './utils/tabIndicator'

initFontScale()
installRequiredFieldHighlight()
installTabIndicator()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
