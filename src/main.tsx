import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// web-base foundation tokens first; ErinnerMich's index.css wins on shared keys.
import "./lib/ui/theme.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
