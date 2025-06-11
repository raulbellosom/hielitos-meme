// src/components/LoginModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";
import wp from "../assets/wp.jpg";

export default function LoginModule({ onLogin }) {
  const db = useContext(DatabaseContext);
  const [usuarios, setUsuarios] = useState([]);
  const [selected, setSelected] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    db.getUsuarios().then(setUsuarios);
  }, [db]);

  const displayMessage = (text, type = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selected || !password) {
      displayMessage("Usuario y contraseña son requeridos");
      return;
    }
    const user = await db.verifyUsuario(selected, password);
    if (!user) {
      displayMessage("Credenciales inválidas");
      return;
    }
    onLogin(user);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-repeat"
      style={{ backgroundImage: `url(${wp})` }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>

        {message.text && (
          <div
            className={`mb-4 text-center ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="block w-full border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-sm shadow-sm transition"
            >
              <option value="">Selecciona un usuario</option>
              {usuarios.map((u) => (
                <option key={u.ID_Usuario} value={u.Nombre}>
                  {u.Nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-sm shadow-sm transition"
              placeholder="••••••••"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm shadow transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
