// src/contexts/DatabaseContext.jsx
import React, { createContext, useContext } from "react";
import {
  getUsuarios,
  addUsuario,
  updateUsuario,
  deleteUsuario,
  verifyUsuario,
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategoria,
  getSabores,
  addSabor,
  updateSabor,
  deleteSabor,
  getMovimientos,
  addMovimiento,
  getVentas,
  addVenta,
  addDetalleVenta,
  getDetalleByVenta,
} from "../services/db.js";

// Creamos el contexto con todas las funciones CRUD
export const DatabaseContext = createContext({
  getUsuarios,
  addUsuario,
  updateUsuario,
  deleteUsuario,
  verifyUsuario,
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategoria,
  getSabores,
  addSabor,
  updateSabor,
  deleteSabor,
  getMovimientos,
  addMovimiento,
  getVentas,
  addVenta,
  addDetalleVenta,
  getDetalleByVenta,
});

export function DatabaseProvider({ children }) {
  // Agrupamos las funciones en un solo objeto
  const api = {
    getUsuarios,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    verifyUsuario,
    getCategorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    getSabores,
    addSabor,
    updateSabor,
    deleteSabor,
    getMovimientos,
    addMovimiento,
    getVentas,
    addVenta,
    addDetalleVenta,
    getDetalleByVenta,
  };

  return (
    <DatabaseContext.Provider value={api}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const database = useContext(DatabaseContext);
  if (!database) {
    throw new Error("useDatabase debe usarse dentro de <DatabaseProvider>");
  }
  return database;
}
