import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // Initialize i18next before rendering
import { warnIfEnvMisconfigured } from "@/lib/env";
import { USE_MOCK_API } from "@/config/env";

// Check environment configuration on startup
warnIfEnvMisconfigured({
  isProd: import.meta.env.PROD,
  useMock: USE_MOCK_API,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_AI_API_URL: import.meta.env.VITE_AI_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_LINE_API_URL: import.meta.env.VITE_LINE_API_URL,
});

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
