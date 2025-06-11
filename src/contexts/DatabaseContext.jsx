import React, { createContext, useEffect, useState } from "react";
import * as db from "../services/db.js";

export const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    db.initDB().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Cargando base de datos local…</span>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}
