// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// registrar + definir <jeep-sqlite>
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
jeepSqlite(window);

/**
 * Inicializa persistencia de almacenamiento y registro del Service Worker.
 * Al estar dentro de una función async, evitamos el error de top-level await.
 */
async function initAppFeatures() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    console.log("Almacenamiento persistente:", granted);
  }

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("🟢 SW registrado"))
        .catch((err) => console.error("🔴 Error al registrar SW:", err));
    });
  }
}

// Llamada a la función de inicialización
initAppFeatures();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
