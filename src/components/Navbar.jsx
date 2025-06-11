// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png"; // Asegúrate de tener un logo en esta ruta

function Navbar({ setCurrentView, userId, isMenuOpen, setIsMenuOpen, logout }) {
  const [darkMode, setDarkMode] = useState(false);

  // Opcional: alterna la clase 'dark' en <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleNavigation = (view) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 shadow-md rounded-b-lg">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* Hamburguesa */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white focus:outline-none cursor-pointer"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Título + toggle tema */}
        <div className="flex justify-center items-center space-x-2">
          <h1 className="text-3xl font-bold text-white">Hielitos Memé</h1>
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full" />
        </div>

        {/* ID usuario */}
        <div className="flex justify-end text-white text-sm break-all">
          ID de Usuario: {userId}
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-blue-700 to-purple-800 z-50 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 flex justify-between items-center border-b border-blue-600">
          <h2 className="text-2xl font-bold text-white">Menú</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-white focus:outline-none cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col p-4 space-y-3">
          {[
            ["pos", "Punto de Venta"],
            ["flavors", "Sabores"],
            ["inventory", "Inventario"],
            ["reports", "Reportes"],
            ["trends", "Tendencias"],
            ["users", "Usuarios"],
          ].map(([view, label]) => (
            <button
              key={view}
              onClick={() => handleNavigation(view)}
              className="w-full text-left cursor-pointer px-4 py-2 text-white hover:bg-blue-600 rounded-lg transition duration-200"
            >
              {label}
            </button>
          ))}

          {/* Botón Cerrar sesión */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
            className="w-full text-left px-4 py-2 text-red-300 hover:bg-red-500 hover:text-white rounded-lg transition duration-200 mt-4"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="absolute bottom-4 left-4 text-white text-xs break-all">
          ID de Usuario: {userId}
        </div>
      </div>

      {/* Overlay para cerrar el menú */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;
