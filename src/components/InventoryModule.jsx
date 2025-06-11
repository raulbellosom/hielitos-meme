// src/components/InventoryModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

export default function InventoryModule() {
  const db = useContext(DatabaseContext);

  // Estados
  const [sabores, setSabores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [newMovement, setNewMovement] = useState({
    ID_Sabor: "",
    Tipo_Movimiento: "Entrada",
    Cantidad: "",
    Observaciones: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  // Carga inicial de datos
  useEffect(() => {
    (async () => {
      setSabores(await db.getSabores());
      setMovimientos(await db.getMovimientos());
    })();
  }, [db]);

  // Mensajes temporales
  const displayMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Manejadores del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMovement((prev) => ({ ...prev, [name]: value }));
  };

  // Envía el movimiento
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ID_Sabor, Tipo_Movimiento, Cantidad, Observaciones } = newMovement;
    if (!ID_Sabor || Cantidad === "") {
      displayMessage("Selecciona un sabor e ingresa una cantidad.", "error");
      return;
    }
    const qty = parseInt(Cantidad, 10);
    if (isNaN(qty) || qty === 0) {
      displayMessage("Cantidad debe ser un número distinto de cero.", "error");
      return;
    }
    try {
      await db.addMovimiento({
        ID_Sabor,
        Tipo_Movimiento,
        Cantidad: qty,
        Observaciones: Observaciones || "",
      });
      displayMessage("Movimiento registrado con éxito.", "success");
      setNewMovement({
        ID_Sabor: "",
        Tipo_Movimiento: "Entrada",
        Cantidad: "",
        Observaciones: "",
      });
      setMovimientos(await db.getMovimientos());
    } catch (e) {
      console.error(e);
      displayMessage("Error al registrar el movimiento.", "error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Movimientos de Inventario 📦
      </h2>

      {/* Mensaje */}
      {message.text && (
        <div
          className={`p-3 mb-4 rounded-lg text-white ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulario inline */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <select
          name="ID_Sabor"
          value={newMovement.ID_Sabor}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">-- Sabor --</option>
          {sabores.map((s) => (
            <option key={s.ID_Sabor} value={s.ID_Sabor}>
              {s.Nombre_Sabor}
            </option>
          ))}
        </select>

        <select
          name="Tipo_Movimiento"
          value={newMovement.Tipo_Movimiento}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option>Entrada</option>
          <option>Salida</option>
          <option>Ajuste</option>
        </select>

        <input
          name="Cantidad"
          value={newMovement.Cantidad}
          onChange={handleChange}
          type="number"
          placeholder="Cantidad"
          className="border p-2 rounded"
        />

        <input
          name="Observaciones"
          value={newMovement.Observaciones}
          onChange={handleChange}
          placeholder="Observaciones"
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="md:col-span-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Agregar Movimiento
        </button>
      </form>

      {/* Tabla de movimientos */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                Fecha
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                Sabor
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                Tipo
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                Cantidad
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                Obs.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movimientos.map((m) => (
              <tr key={m.ID_Movimiento}>
                <td className="py-3 px-4">{m.Fecha_Hora.toLocaleString()}</td>
                <td className="py-3 px-4">
                  {sabores.find((s) => s.ID_Sabor === m.ID_Sabor)?.Nombre_Sabor}
                </td>
                <td className="py-3 px-4">{m.Tipo_Movimiento}</td>
                <td className="py-3 px-4">{m.Cantidad}</td>
                <td className="py-3 px-4">{m.Observaciones}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="py-4 px-4 text-gray-500 italic text-center"
                >
                  No hay movimientos registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
