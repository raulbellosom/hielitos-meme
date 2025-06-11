// src/components/LoginModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

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
      displayMessage("Selecciona usuario e ingresa contraseña.");
      return;
    }
    const user = await db.verifyUsuario(selected, password);
    if (!user) {
      displayMessage("Credenciales inválidas.");
    } else {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Iniciar Sesión
        </h2>
        {message.text && (
          <div
            className={`p-2 mb-4 rounded text-white ${
              message.type === "error" ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {message.text}
          </div>
        )}
        <label className="block mb-2 font-semibold">Usuario</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">-- Selecciona --</option>
          {usuarios.map((u) => (
            <option key={u.ID_Usuario} value={u.Nombre}>
              {u.Nombre}
            </option>
          ))}
        </select>
        <label className="block mb-2 font-semibold">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded mb-6"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
