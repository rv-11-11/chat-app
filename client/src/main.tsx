import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

// Store install prompt for later use
let deferredPrompt: any = null;
let installPromptCount = 0;
const MAX_INSTALL_PROMPTS = 3; // Show prompt up to 3 times

// Handle PWA install prompt - show 2-3 times during session
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install prompt up to MAX_INSTALL_PROMPTS times with increasing delays
  if (installPromptCount < MAX_INSTALL_PROMPTS) {
    installPromptCount++;
    // Delays: 1st at 3s, 2nd at 6s, 3rd at 12s
    const delays = [3000, 6000, 12000];
    const delay = delays[installPromptCount - 1] || 30000;
    
    setTimeout(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
            installPromptCount = MAX_INSTALL_PROMPTS; // Stop showing after accepted
          } else {
            console.log("User dismissed the install prompt");
          }
          // Allow showing again on next beforeinstallprompt event
          deferredPrompt = null;
        });
      }
    }, delay);
  }
});

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        // Service Worker registered successfully
      })
      .catch(() => {
        // Service Worker registration failed
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

