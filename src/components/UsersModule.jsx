import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

export default function UsersModule() {
  const db = useContext(DatabaseContext);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    ID_Usuario: "",
    Nombre: "",
    Password: "",
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Carga inicial de usuarios
  useEffect(() => {
    async function loadUsers() {
      const all = await db.getUsuarios();
      setUsers(all);
    }
    loadUsers();
  }, [db]);

  const displayMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const resetForm = () => {
    setForm({ ID_Usuario: "", Nombre: "", Password: "" });
    setEditing(false);
  };

  const loadUsers = async () => {
    const all = await db.getUsuarios();
    setUsers(all);
  };

  const handleSave = async () => {
    const { Nombre, Password, ID_Usuario } = form;
    if (!Nombre || !Password) {
      displayMessage("Completa nombre y contraseña.", "error");
      return;
    }
    try {
      if (editing) {
        await db.updateUsuario({ ID_Usuario, Nombre, Password });
        displayMessage("Usuario actualizado.");
      } else {
        await db.addUsuario({ Nombre, Password });
        displayMessage("Usuario añadido.");
      }
      await loadUsers();
      resetForm();
    } catch (e) {
      console.error(e);
      displayMessage("Error al guardar usuario.", "error");
    }
  };

  const handleEdit = (u) => {
    setForm({
      ID_Usuario: u.ID_Usuario,
      Nombre: u.Nombre,
      Password: u.Password,
    });
    setEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;
    try {
      await db.deleteUsuario(id);
      displayMessage("Usuario eliminado.");
      await loadUsers();
    } catch (e) {
      console.error(e);
      displayMessage("Error al eliminar usuario.", "error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios 👥</h2>
      {message.text && (
        <div
          className={`p-2 mb-4 text-white rounded ${
            message.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          placeholder="Nombre"
          value={form.Nombre}
          onChange={(e) => setForm((f) => ({ ...f, Nombre: e.target.value }))}
          className="border p-2 rounded flex-1 min-w-[120px]"
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={form.Password}
          onChange={(e) => setForm((f) => ({ ...f, Password: e.target.value }))}
          className="border p-2 rounded flex-1 min-w-[120px]"
        />
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {editing ? "Guardar" : "Añadir"}
        </button>
        {editing && (
          <button
            onClick={resetForm}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancelar
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg shadow overflow-hidden">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.ID_Usuario} className="hover:bg-gray-50">
                <td className="p-2">{u.Nombre}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="text-yellow-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(u.ID_Usuario)}
                    className="text-red-600 hover:underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan="2"
                  className="p-4 text-center text-gray-500 italic"
                >
                  Sin usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
