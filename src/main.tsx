import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { UpdatePrompt } from "./lib/pwa/UpdatePrompt.tsx";
import { createAppRouter } from "./lib/router.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

const router = createAppRouter();

// The routes catch their own errors (AppRouteError); ErrorBoundary is the last
// resort for anything outside them.
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </ErrorBoundary>
  </StrictMode>,
);
