// src/services/db.js
import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";

const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbConnection = null;

export async function initDB() {
  if (dbConnection) return dbConnection;

  // 1) Si es web, inicializa motor WASM + IndexedDB
  if (Capacitor.getPlatform() === "web") {
    await sqlite.initWebStore();
    // ¡Clave! Chequear conexiones existentes para no crear una nueva limpia
    await sqlite.checkConnectionsConsistency();
  }

  // 2) Crear/abrir la conexión
  dbConnection = await sqlite.createConnection(
    "hielitosDB",
    false,
    "no-encryption",
    1
  );
  await dbConnection.open();

  // Crear tablas si no existen
  const stmts = [
    `CREATE TABLE IF NOT EXISTS Usuarios (
      ID_Usuario TEXT PRIMARY KEY,
      Nombre TEXT NOT NULL,
      Password TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS Categorias (
      ID_Categoria TEXT PRIMARY KEY,
      Nombre_Categoria TEXT,
      Precio_Base REAL,
      Parent_ID_Categoria TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS Sabores (
      ID_Sabor TEXT PRIMARY KEY,
      Nombre_Sabor TEXT,
      ID_Categoria TEXT,
      Precio REAL,
      Color TEXT,
      Activo INTEGER,
      Imagen_URL TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS Movimientos_Inventario (
      ID_Movimiento TEXT PRIMARY KEY,
      ID_Sabor TEXT,
      Tipo_Movimiento TEXT,
      Cantidad INTEGER,
      Observaciones TEXT,
      Fecha_Hora INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS Ventas (
      ID_Venta TEXT PRIMARY KEY,
      Tipo_Venta TEXT,
      Total_Venta REAL,
      Pago_Cliente REAL,
      Cambio REAL,
      Porcentaje_Descuento REAL,
      Monto_Descuento_Fijo REAL,
      Fecha_Hora INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS Detalle_Venta (
      ID_Detalle TEXT PRIMARY KEY,
      ID_Venta TEXT,
      ID_Sabor TEXT,
      Cantidad_Vendida INTEGER,
      Subtotal REAL
    );`,
  ];
  for (const sql of stmts) {
    await dbConnection.execute(sql);
  }

  // Seed de admin si no existe
  const countRes = await dbConnection.query(
    "SELECT COUNT(*) AS cnt FROM Usuarios;"
  );
  const cnt = countRes.values[0].cnt || 0;
  if (cnt === 0) {
    const ID_Usuario = uuid();
    await dbConnection.run(
      "INSERT INTO Usuarios (ID_Usuario, Nombre, Password) VALUES (?,?,?);",
      [ID_Usuario, "admin", "admin"]
    );
  }

  return dbConnection;
}

// Helpers
const now = () => Date.now();
const uuid = () => crypto.randomUUID();

// --- CRUD Usuarios ---
export async function getUsuarios() {
  const db = await initDB();
  const res = await db.query("SELECT * FROM Usuarios ORDER BY Nombre;");
  return res.values;
}

export async function addUsuario({ Nombre, Password }) {
  const db = await initDB();
  const ID_Usuario = uuid();
  await db.run(
    "INSERT INTO Usuarios (ID_Usuario, Nombre, Password) VALUES (?,?,?);",
    [ID_Usuario, Nombre, Password]
  );
  return { ID_Usuario, Nombre };
}

export async function updateUsuario({ ID_Usuario, Nombre, Password }) {
  const db = await initDB();
  await db.run("UPDATE Usuarios SET Nombre=?, Password=? WHERE ID_Usuario=?;", [
    Nombre,
    Password,
    ID_Usuario,
  ]);
}

export async function deleteUsuario(ID_Usuario) {
  const db = await initDB();
  await db.run("DELETE FROM Usuarios WHERE ID_Usuario=?;", [ID_Usuario]);
}

export async function verifyUsuario(Nombre, Password) {
  const db = await initDB();
  const res = await db.query(
    "SELECT ID_Usuario, Nombre FROM Usuarios WHERE Nombre=? AND Password=?;",
    [Nombre, Password]
  );
  return res.values[0] || null;
}

// --- CRUD Categorías ---
export async function getCategorias() {
  const db = await initDB();
  const res = await db.query(
    "SELECT * FROM Categorias ORDER BY Nombre_Categoria;"
  );
  return res.values;
}

export async function addCategoria({
  Nombre_Categoria,
  Precio_Base,
  Parent_ID_Categoria,
}) {
  const db = await initDB();
  const id = uuid();
  await db.run(
    "INSERT INTO Categorias (ID_Categoria, Nombre_Categoria, Precio_Base, Parent_ID_Categoria) VALUES (?,?,?,?);",
    [id, Nombre_Categoria, Precio_Base || 0, Parent_ID_Categoria || ""]
  );
  return id;
}

export async function updateCategoria({
  ID_Categoria,
  Nombre_Categoria,
  Precio_Base,
  Parent_ID_Categoria,
}) {
  const db = await initDB();
  await db.run(
    "UPDATE Categorias SET Nombre_Categoria=?, Precio_Base=?, Parent_ID_Categoria=? WHERE ID_Categoria=?;",
    [
      Nombre_Categoria,
      Precio_Base || 0,
      Parent_ID_Categoria || "",
      ID_Categoria,
    ]
  );
}

export async function deleteCategoria(ID_Categoria) {
  const db = await initDB();
  await db.run("DELETE FROM Categorias WHERE ID_Categoria=?;", [ID_Categoria]);
}

// --- CRUD Sabores ---
export async function getSabores() {
  const db = await initDB();
  const res = await db.query("SELECT * FROM Sabores ORDER BY Nombre_Sabor;");
  return res.values;
}

export async function addSabor({
  Nombre_Sabor,
  ID_Categoria,
  Precio,
  Color,
  Activo,
  Imagen_URL,
}) {
  const db = await initDB();
  const id = uuid();
  await db.run(
    "INSERT INTO Sabores (ID_Sabor, Nombre_Sabor, ID_Categoria, Precio, Color, Activo, Imagen_URL) VALUES (?,?,?,?,?,?,?);",
    [
      id,
      Nombre_Sabor,
      ID_Categoria,
      Precio || 0,
      Color || "",
      Activo ? 1 : 0,
      Imagen_URL || "",
    ]
  );
  return id;
}

export async function updateSabor({
  ID_Sabor,
  Nombre_Sabor,
  ID_Categoria,
  Precio,
  Color,
  Activo,
  Imagen_URL,
}) {
  const db = await initDB();
  await db.run(
    "UPDATE Sabores SET Nombre_Sabor=?, ID_Categoria=?, Precio=?, Color=?, Activo=?, Imagen_URL=? WHERE ID_Sabor=?;",
    [
      Nombre_Sabor,
      ID_Categoria,
      Precio || 0,
      Color || "",
      Activo ? 1 : 0,
      Imagen_URL || "",
      ID_Sabor,
    ]
  );
}

export async function deleteSabor(ID_Sabor) {
  const db = await initDB();
  await db.run("DELETE FROM Sabores WHERE ID_Sabor=?;", [ID_Sabor]);
}

// --- Movimientos Inventario ---
export async function getMovimientos() {
  const db = await initDB();
  const res = await db.query(
    "SELECT * FROM Movimientos_Inventario ORDER BY Fecha_Hora DESC;"
  );
  return res.values.map((r) => ({ ...r, Fecha_Hora: new Date(r.Fecha_Hora) }));
}

export async function addMovimiento({
  ID_Sabor,
  Tipo_Movimiento,
  Cantidad,
  Observaciones,
}) {
  const db = await initDB();
  const id = uuid();
  await db.run(
    "INSERT INTO Movimientos_Inventario (ID_Movimiento, ID_Sabor, Tipo_Movimiento, Cantidad, Observaciones, Fecha_Hora) VALUES (?,?,?,?,?,?);",
    [id, ID_Sabor, Tipo_Movimiento, Cantidad || 0, Observaciones || "", now()]
  );
  return id;
}

// --- Ventas ---
export async function getVentas() {
  const db = await initDB();
  const res = await db.query("SELECT * FROM Ventas ORDER BY Fecha_Hora DESC;");
  return res.values.map((v) => ({ ...v, Fecha_Hora: new Date(v.Fecha_Hora) }));
}

export async function addVenta({
  Tipo_Venta,
  Total_Venta,
  Pago_Cliente,
  Cambio,
  Porcentaje_Descuento,
  Monto_Descuento_Fijo,
}) {
  const db = await initDB();
  const id = uuid();
  await db.run(
    "INSERT INTO Ventas (ID_Venta, Tipo_Venta, Total_Venta, Pago_Cliente, Cambio, Porcentaje_Descuento, Monto_Descuento_Fijo, Fecha_Hora) VALUES (?,?,?,?,?,?,?,?);",
    [
      id,
      Tipo_Venta || "",
      Total_Venta || 0,
      Pago_Cliente || 0,
      Cambio || 0,
      Porcentaje_Descuento || 0,
      Monto_Descuento_Fijo || 0,
      now(),
    ]
  );
  return id;
}

// --- Detalle Venta ---
export async function addDetalleVenta({
  ID_Venta,
  ID_Sabor,
  Cantidad_Vendida,
  Subtotal,
}) {
  const db = await initDB();
  const id = uuid();
  await db.run(
    "INSERT INTO Detalle_Venta (ID_Detalle, ID_Venta, ID_Sabor, Cantidad_Vendida, Subtotal) VALUES (?,?,?,?,?);",
    [id, ID_Venta, ID_Sabor, Cantidad_Vendida || 0, Subtotal || 0]
  );
  return id;
}

export async function getDetalleByVenta(ID_Venta) {
  const db = await initDB();
  const res = await db.query("SELECT * FROM Detalle_Venta WHERE ID_Venta=?;", [
    ID_Venta,
  ]);
  return res.values;
}
