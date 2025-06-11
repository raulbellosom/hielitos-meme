import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// registrar + definir <jeep-sqlite>
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
jeepSqlite(window);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("🟢 SW registrado"))
      .catch((err) => console.error("🔴 Error al registrar SW:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
