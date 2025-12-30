import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

// Create Convex client only if URL is configured
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined

let convexClient: ConvexReactClient | null = null
if (convexUrl) {
  convexClient = new ConvexReactClient(convexUrl)
}

// Wrapper component that conditionally provides Convex
function ConvexWrapper({ children }: { children: React.ReactNode }) {
  if (convexClient) {
    return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
  }
  // When no Convex URL is configured, render without provider
  // Components will get undefined from useQuery which triggers fallback data
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexWrapper>
      <App />
    </ConvexWrapper>
  </StrictMode>,
)
