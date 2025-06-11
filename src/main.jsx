// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// registrar + definir <jeep-sqlite>
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
jeepSqlite(window);

// gestor de conexiones SQLite-Web
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
const sqlite = new SQLiteConnection(CapacitorSQLite);

// cerrar la conexión solo si existe
window.addEventListener("beforeunload", async () => {
  try {
    const conns = await sqlite.getAllConnections();
    if (conns.includes("hielitosDB")) {
      await sqlite.closeConnection("hielitosDB");
      console.log("Conexión SQLite cerrada al salir");
    }
  } catch (e) {
    console.error("Error cerrando conexión SQLite:", e);
  }
});

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

initAppFeatures();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
