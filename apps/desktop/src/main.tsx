import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";


const log = (msg: string) => {
  console.log(`[FRONTEND] ${msg}`);
};

// Global Error Handler
window.onerror = (message, source, lineno, colno) => {
  console.error(`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`);
  return false;
};

window.onunhandledrejection = (event) => {
  console.error(`[UNHANDLED REJECTION] ${event.reason}`);
};

log("--- main.tsx starting ---");

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        log("CRITICAL: Root element not found!");
    } else {
        log("Root element found. Rendering App...");
        ReactDOM.createRoot(rootElement).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        log("ReactDOM.render called.");
    }
} catch (e: any) {
    log(`FATAL RENDER ERROR: ${e.message}`);
}
