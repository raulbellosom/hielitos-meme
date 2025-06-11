// src/components/ReportsModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

export default function ReportsModule() {
  const db = useContext(DatabaseContext);

  // Estados
  const [categories, setCategories] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [detallesMap, setDetallesMap] = useState({}); // { saleId: [detalle,...] }
  const [usuarios, setUsuarios] = useState([]);

  // Carga inicial de datos
  useEffect(() => {
    async function loadAll() {
      setCategories(await db.getCategorias());
      setSabores(await db.getSabores());
      setMovimientos(await db.getMovimientos());
      setVentas(await db.getVentas());
      setUsuarios(await db.getUsuarios());
    }
    loadAll();
  }, [db]);

  // Carga detalles de cada venta
  useEffect(() => {
    async function loadDetalles() {
      const map = {};
      await Promise.all(
        ventas.map(async (v) => {
          map[v.ID_Venta] = await db.getDetalleByVenta(v.ID_Venta);
        })
      );
      setDetallesMap(map);
    }
    loadDetalles();
  }, [ventas, db]);

  // Helpers
  const getInventoryForFlavor = (id) =>
    movimientos
      .filter((m) => m.ID_Sabor === id)
      .reduce(
        (sum, m) =>
          sum +
          (m.Tipo_Movimiento.startsWith("Entrada") ? m.Cantidad : -m.Cantidad),
        0
      );

  const getUserName = (uid) =>
    usuarios.find((u) => u.ID_Usuario === uid)?.Nombre || "Desconocido";

  // Cálculos de resumen
  const totalGlobalStock = sabores.reduce(
    (sum, s) => sum + getInventoryForFlavor(s.ID_Sabor),
    0
  );

  const totalByCategory = categories.reduce((acc, cat) => {
    acc[cat.Nombre_Categoria] = sabores
      .filter((s) => s.ID_Categoria === cat.ID_Categoria)
      .reduce((sum, s) => sum + getInventoryForFlavor(s.ID_Sabor), 0);
    return acc;
  }, {});

  const totalMoneyGenerated = ventas.reduce((sum, v) => {
    if (
      v.Tipo_Venta === "Normal" ||
      v.Tipo_Venta === "Descuento" ||
      (v.Total_Venta || 0) > 0
    ) {
      return sum + (v.Total_Venta || 0);
    }
    return sum;
  }, 0);

  const totalMoneyInStock = sabores.reduce(
    (sum, s) => sum + getInventoryForFlavor(s.ID_Sabor) * (s.Precio || 0),
    0
  );

  const totalDiscountLoss = ventas.reduce((sum, v) => {
    if (v.Tipo_Venta === "Descuento") {
      if ((v.Monto_Descuento_Fijo || 0) > 0) {
        return sum + (v.Monto_Descuento_Fijo || 0);
      }
      const orig =
        (v.Total_Venta || 0) / (1 - (v.Porcentaje_Descuento || 0) / 100);
      return sum + (orig - (v.Total_Venta || 0));
    }
    return sum;
  }, 0);

  const totalDonationLoss = ventas.reduce((sum, v) => {
    if (v.Tipo_Venta === "Donacion") {
      const dets = detallesMap[v.ID_Venta] || [];
      return sum + dets.reduce((s2, d) => s2 + (d.Subtotal || 0), 0);
    }
    return sum;
  }, 0);

  const totalLoss = totalDiscountLoss + totalDonationLoss;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Reportes y Totales 📊
      </h2>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Stock Global" value={totalGlobalStock} bg="blue" />
        <StatCard
          title="Dinero Generado"
          value={`$${totalMoneyGenerated.toFixed(2)}`}
          bg="green"
        />
        <StatCard
          title="Valor en Stock"
          value={`$${totalMoneyInStock.toFixed(2)}`}
          bg="purple"
        />
        <StatCard
          title="Pérdida por Descuentos"
          value={`-$${totalDiscountLoss.toFixed(2)}`}
          bg="red"
        />
        <StatCard
          title="Pérdida por Donaciones"
          value={`-$${totalDonationLoss.toFixed(2)}`}
          bg="red"
        />
        <StatCard
          title="Total Pérdidas"
          value={`-$${totalLoss.toFixed(2)}`}
          bg="redDark"
        />
      </div>

      {/* Stock por categoría */}
      <Section title="Stock por Categoría">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-left">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(totalByCategory).map(([cat, qty]) => (
              <tr key={cat}>
                <td className="p-2">{cat}</td>
                <td className="p-2 font-bold">{qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Stock individual por sabor */}
      <Section title="Stock Individual por Sabor">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Sabor</th>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-left">Precio</th>
              <th className="p-2 text-left">Inventario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sabores.map((s) => (
              <tr key={s.ID_Sabor} className="hover:bg-gray-50">
                <td className="p-2">{s.Nombre_Sabor}</td>
                <td className="p-2">{s.Nombre_Categoria}</td>
                <td className="p-2">${s.Precio.toFixed(2)}</td>
                <td className="p-2 font-bold">
                  {getInventoryForFlavor(s.ID_Sabor)}
                </td>
              </tr>
            ))}
            {!sabores.length && (
              <tr>
                <td colSpan="4" className="py-4 text-center italic">
                  Sin sabores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Historial de Ventas con Usuario */}
      <Section title="Historial de Ventas">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              {/* <th className="p-2 text-left">ID Venta</th> */}
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Subtotal</th>
              <th className="p-2 text-left">Descuento</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Pago</th>
              <th className="p-2 text-left">Cambio</th>
              <th className="p-2 text-left">Vendedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ventas.map((v) => {
              const dets = detallesMap[v.ID_Venta] || [];
              const original = dets.reduce((s, d) => s + (d.Subtotal || 0), 0);
              const discountAmt =
                v.Tipo_Venta === "Descuento"
                  ? v.Monto_Descuento_Fijo ||
                    (original * (v.Porcentaje_Descuento || 0)) / 100
                  : 0;
              const userName = getUserName(v.ID_Usuario);
              return (
                <tr key={v.ID_Venta} className="hover:bg-gray-50">
                  {/* <td className="p-2">{v.ID_Venta}</td> */}
                  <td className="p-2">{v.Fecha_Hora.toLocaleString()}</td>
                  <td className="p-2">{v.Tipo_Venta}</td>
                  <td className="p-2">${original.toFixed(2)}</td>
                  <td className="p-2">${discountAmt.toFixed(2)}</td>
                  <td className="p-2">${(v.Total_Venta || 0).toFixed(2)}</td>
                  <td className="p-2">${(v.Pago_Cliente || 0).toFixed(2)}</td>
                  <td className="p-2">${(v.Cambio || 0).toFixed(2)}</td>
                  <td className="p-2">{userName}</td>
                </tr>
              );
            })}
            {!ventas.length && (
              <tr>
                <td colSpan="9" className="py-4 text-center italic">
                  Sin ventas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function StatCard({ title, value, bg }) {
  const colors = {
    blue: "bg-blue-100 border-blue-500 text-blue-900",
    green: "bg-green-100 border-green-500 text-green-900",
    purple: "bg-purple-100 border-purple-500 text-purple-900",
    red: "bg-red-100 border-red-500 text-red-900",
    redDark: "bg-red-200 border-red-700 text-red-950",
  };
  return (
    <div className={`${colors[bg]} p-6 rounded-lg shadow-md border-l-4`}>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="overflow-x-auto rounded-lg shadow">{children}</div>
    </div>
  );
}
