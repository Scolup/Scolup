import "./services/localDataVersion"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { LazyMotion, MotionConfig, domMax } from "motion/react"

import "./index.css"
import App from "./App"
import { registerServiceWorker } from "./services/serviceWorker"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ApiErrorScreen } from "./components/ApiErrorScreen"
import { ThemeProvider } from "./components/ThemeProvider"
import { apiErrorStore } from "./services/apiErrorStore"
import { armSplashReset } from "./services/splashReset"

registerServiceWorker()
armSplashReset()

function Root() {
  const error = apiErrorStore.use()
  return error ? <ApiErrorScreen {...error} /> : <App />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domMax}>
          <ThemeProvider>
            <ErrorBoundary>
              <Root />
            </ErrorBoundary>
          </ThemeProvider>
        </LazyMotion>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
)
