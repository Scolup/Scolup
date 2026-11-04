import "./services/localDataVersion"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

import "./index.css"
import App from "./App"
import { registerServiceWorker } from "./services/serviceWorker"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ThemeProvider } from "./components/ThemeProvider"

registerServiceWorker()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
          <ThemeProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ThemeProvider>
        </LazyMotion>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
)
