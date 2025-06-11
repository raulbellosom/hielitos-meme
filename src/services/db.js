// src/services/db.js
import Dexie from "dexie";

export const db = new Dexie("hielitosDB");
db.version(1).stores({
  Usuarios: "ID_Usuario, Nombre, Password",
  Categorias:
    "ID_Categoria, Nombre_Categoria, Precio_Base, Parent_ID_Categoria",
  Sabores:
    "ID_Sabor, Nombre_Sabor, ID_Categoria, Precio, Color, Activo, Imagen_URL",
  Movimientos_Inventario:
    "ID_Movimiento, ID_Sabor, Tipo_Movimiento, Cantidad, Observaciones, Fecha_Hora",
  Ventas:
    "ID_Venta, Tipo_Venta, Total_Venta, Pago_Cliente, Cambio, Porcentaje_Descuento, Monto_Descuento_Fijo, Fecha_Hora",
  Detalle_Venta: "ID_Detalle, ID_Venta, ID_Sabor, Cantidad_Vendida, Subtotal",
});

// Al crearse la DB por primera vez, sembramos el usuario admin/admin
db.on("populate", async () => {
  const ID_Usuario = crypto.randomUUID();
  await db.Usuarios.add({ ID_Usuario, Nombre: "admin", Password: "admin" });
});

const now = () => Date.now();
const uuid = () => crypto.randomUUID();

// --- CRUD Usuarios ---
export async function getUsuarios() {
  return db.Usuarios.orderBy("Nombre").toArray();
}

export async function addUsuario({ Nombre, Password }) {
  const ID_Usuario = uuid();
  await db.Usuarios.add({ ID_Usuario, Nombre, Password });
  return { ID_Usuario, Nombre };
}

export async function updateUsuario({ ID_Usuario, Nombre, Password }) {
  await db.Usuarios.update(ID_Usuario, { Nombre, Password });
}

export async function deleteUsuario(ID_Usuario) {
  await db.Usuarios.delete(ID_Usuario);
}

export async function verifyUsuario(Nombre, Password) {
  return db.Usuarios.where({ Nombre, Password }).first();
}

// --- CRUD Categorías ---
export async function getCategorias() {
  return db.Categorias.orderBy("Nombre_Categoria").toArray();
}

export async function addCategoria({
  Nombre_Categoria,
  Precio_Base = 0,
  Parent_ID_Categoria = "",
}) {
  const ID_Categoria = uuid();
  await db.Categorias.add({
    ID_Categoria,
    Nombre_Categoria,
    Precio_Base,
    Parent_ID_Categoria,
  });
  return ID_Categoria;
}

export async function updateCategoria({
  ID_Categoria,
  Nombre_Categoria,
  Precio_Base = 0,
  Parent_ID_Categoria = "",
}) {
  await db.Categorias.update(ID_Categoria, {
    Nombre_Categoria,
    Precio_Base,
    Parent_ID_Categoria,
  });
}

export async function deleteCategoria(ID_Categoria) {
  await db.Categorias.delete(ID_Categoria);
}

// --- CRUD Sabores ---
export async function getSabores() {
  return db.Sabores.orderBy("Nombre_Sabor").toArray();
}

export async function addSabor({
  Nombre_Sabor,
  ID_Categoria,
  Precio = 0,
  Color = "",
  Activo = false,
  Imagen_URL = "",
}) {
  const ID_Sabor = uuid();
  await db.Sabores.add({
    ID_Sabor,
    Nombre_Sabor,
    ID_Categoria,
    Precio,
    Color,
    Activo: Activo ? 1 : 0,
    Imagen_URL,
  });
  return ID_Sabor;
}

export async function updateSabor({
  ID_Sabor,
  Nombre_Sabor,
  ID_Categoria,
  Precio = 0,
  Color = "",
  Activo = false,
  Imagen_URL = "",
}) {
  await db.Sabores.update(ID_Sabor, {
    Nombre_Sabor,
    ID_Categoria,
    Precio,
    Color,
    Activo: Activo ? 1 : 0,
    Imagen_URL,
  });
}

export async function deleteSabor(ID_Sabor) {
  await db.Sabores.delete(ID_Sabor);
}

// --- Movimientos Inventario ---
export async function getMovimientos() {
  const arr = await db.Movimientos_Inventario.orderBy("Fecha_Hora")
    .reverse()
    .toArray();
  return arr.map((r) => ({ ...r, Fecha_Hora: new Date(r.Fecha_Hora) }));
}

export async function addMovimiento({
  ID_Sabor,
  Tipo_Movimiento,
  Cantidad = 0,
  Observaciones = "",
}) {
  const ID_Movimiento = uuid();
  await db.Movimientos_Inventario.add({
    ID_Movimiento,
    ID_Sabor,
    Tipo_Movimiento,
    Cantidad,
    Observaciones,
    Fecha_Hora: now(),
  });
  return ID_Movimiento;
}

// --- Ventas ---
export async function getVentas() {
  const arr = await db.Ventas.orderBy("Fecha_Hora").reverse().toArray();
  return arr.map((v) => ({ ...v, Fecha_Hora: new Date(v.Fecha_Hora) }));
}

export async function addVenta({
  Tipo_Venta = "",
  Total_Venta = 0,
  Pago_Cliente = 0,
  Cambio = 0,
  Porcentaje_Descuento = 0,
  Monto_Descuento_Fijo = 0,
}) {
  const ID_Venta = uuid();
  await db.Ventas.add({
    ID_Venta,
    Tipo_Venta,
    Total_Venta,
    Pago_Cliente,
    Cambio,
    Porcentaje_Descuento,
    Monto_Descuento_Fijo,
    Fecha_Hora: now(),
  });
  return ID_Venta;
}

// --- Detalle Venta ---
export async function addDetalleVenta({
  ID_Venta,
  ID_Sabor,
  Cantidad_Vendida = 0,
  Subtotal = 0,
}) {
  const ID_Detalle = uuid();
  await db.Detalle_Venta.add({
    ID_Detalle,
    ID_Venta,
    ID_Sabor,
    Cantidad_Vendida,
    Subtotal,
  });
  return ID_Detalle;
}

export async function getDetalleByVenta(ID_Venta) {
  return db.Detalle_Venta.where("ID_Venta").equals(ID_Venta).toArray();
}
