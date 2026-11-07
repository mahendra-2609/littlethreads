import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Two routes, so no router dependency: /admin loads the CRM lazily, everything else is the site.
const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";
const Admin = React.lazy(() => import("./admin/Admin"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
