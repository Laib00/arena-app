import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import App from "./App";
import LandingPage from "./landing/LandingPage";
import { APP_BASE, appPath } from "./routes";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

/** Old /app bookmarks → /dashboard (keep subpath + query). */
function LegacyAppRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/app/, "") || "";
  return <Navigate to={`${APP_BASE}${rest}${location.search}${location.hash}`} replace />;
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path={`${APP_BASE}/*`} element={<App />} />
        <Route path="/app/*" element={<LegacyAppRedirect />} />
        <Route path="/login" element={<Navigate to={appPath()} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
