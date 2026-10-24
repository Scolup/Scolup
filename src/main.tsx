import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

import "./index.css"
import App from "@/App"
import { registerServiceWorker } from "@/services/service-worker"
import { ErrorBoundary } from "@/ui/error-boundary"
import { ThemeProvider } from "@/ui/theme-provider"

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
