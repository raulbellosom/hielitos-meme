import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

export default function TrendsModule() {
  const db = useContext(DatabaseContext);

  const [ventas, setVentas] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [detallesMap, setDetallesMap] = useState({}); // { ventaId: [detalles...] }

  // Carga inicial: ventas, sabores, usuarios
  useEffect(() => {
    async function loadData() {
      setVentas(await db.getVentas());
      setSabores(await db.getSabores());
      setUsuarios(await db.getUsuarios());
    }
    loadData();
  }, [db]);

  // Carga detalles por venta
  useEffect(() => {
    async function loadDetalles() {
      const map = {};
      for (let v of ventas) {
        map[v.ID_Venta] = await db.getDetalleByVenta(v.ID_Venta);
      }
      setDetallesMap(map);
    }
    loadDetalles();
  }, [ventas, db]);

  // Helper para nombre
  const getProductName = (id) =>
    sabores.find((s) => s.ID_Sabor === id)?.Nombre_Sabor || "Desconocido";
  const getUserName = (id) =>
    usuarios.find((u) => u.ID_Usuario === id)?.Nombre || "Anónimo";

  // Producto más vendido
  const topProduct = (() => {
    const counts = {};
    Object.values(detallesMap)
      .flat()
      .forEach((d) => {
        counts[d.ID_Sabor] = (counts[d.ID_Sabor] || 0) + d.Cantidad_Vendida;
      });
    if (!Object.keys(counts).length) return { name: "N/A", qty: 0 };
    const [id, qty] = Object.entries(counts).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );
    return { name: getProductName(id), qty };
  })();

  // Día más vendido
  const topDay = (() => {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const sums = {};
    ventas.forEach((v) => {
      const d = new Date(v.Fecha_Hora).getDay();
      sums[d] = (sums[d] || 0) + (v.Total_Venta || 0);
    });
    if (!Object.keys(sums).length) return "N/A";
    const [day] = Object.entries(sums).reduce((a, b) => (b[1] > a[1] ? b : a));
    return days[day];
  })();

  // Mes más vendido
  const topMonth = (() => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const sums = {};
    ventas.forEach((v) => {
      const m = new Date(v.Fecha_Hora).getMonth();
      sums[m] = (sums[m] || 0) + (v.Total_Venta || 0);
    });
    if (!Object.keys(sums).length) return "N/A";
    const [m] = Object.entries(sums).reduce((a, b) => (b[1] > a[1] ? b : a));
    return months[m];
  })();

  // Hora pico
  const topHour = (() => {
    const sums = {};
    ventas.forEach((v) => {
      const h = new Date(v.Fecha_Hora).getHours();
      sums[h] = (sums[h] || 0) + (v.Total_Venta || 0);
    });
    if (!Object.keys(sums).length) return "N/A";
    const [h] = Object.entries(sums).reduce((a, b) => (b[1] > a[1] ? b : a));
    return `${h}:00–${parseInt(h) + 1}:00`;
  })();

  // Usuario que más vende
  const topUser = (() => {
    const sums = {};
    ventas.forEach((v) => {
      if (v.ID_Usuario)
        sums[v.ID_Usuario] = (sums[v.ID_Usuario] || 0) + (v.Total_Venta || 0);
    });
    if (!Object.keys(sums).length) return { name: "N/A", total: 0 };
    const [uid, total] = Object.entries(sums).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );
    return { name: getUserName(uid), total };
  })();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Tendencias de Ventas 📈
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Producto */}
        <StatCard
          color="blue"
          title="Producto más vendido"
          value={`${topProduct.name} (${topProduct.qty} uds)`}
        />
        {/* Día */}
        <StatCard color="green" title="Día más vendido" value={topDay} />
        {/* Mes */}
        <StatCard color="purple" title="Mes más vendido" value={topMonth} />
        {/* Hora */}
        <StatCard color="yellow" title="Hora pico de ventas" value={topHour} />
        {/* Usuario */}
        <StatCard
          color="indigo"
          title="Vendedor top"
          value={`${topUser.name} ($${topUser.total.toFixed(2)})`}
        />
      </div>
      <div className="mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Gráficas Futuras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Placeholder text="Unidades vendidas por sabor" />
          <Placeholder text="Ventas por hora/día" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ color, title, value }) {
  const bg = {
    blue: "bg-blue-100 border-blue-500 text-blue-900",
    green: "bg-green-100 border-green-500 text-green-900",
    purple: "bg-purple-100 border-purple-500 text-purple-900",
    yellow: "bg-yellow-100 border-yellow-500 text-yellow-900",
    indigo: "bg-indigo-100 border-indigo-500 text-indigo-900",
  }[color];
  return (
    <div className={`${bg} p-6 rounded-lg shadow-md border-l-4`}>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Placeholder({ text }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200 text-gray-700">
      {text}
    </div>
  );
}
