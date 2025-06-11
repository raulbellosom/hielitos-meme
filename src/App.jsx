// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { DatabaseProvider } from "./contexts/DatabaseContext.jsx";
import Navbar from "./components/Navbar.jsx";
import LoginModule from "./components/LoginModule.jsx";
import UsersModule from "./components/UsersModule.jsx";
import FlavorsModule from "./components/FlavorsModule.jsx";
import InventoryModule from "./components/InventoryModule.jsx";
import POSModule from "./components/POSModule.jsx";
import ReportsModule from "./components/ReportsModule.jsx";
import TrendsModule from "./components/TrendsModule.jsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("pos");
  const [menuOpen, setMenuOpen] = useState(false);

  // Restaura sesión
  useEffect(() => {
    const storedId = localStorage.getItem("hielitosUserId");
    const storedName = localStorage.getItem("hielitosUserName");
    if (storedId && storedName) {
      setCurrentUser({ ID_Usuario: storedId, Nombre: storedName });
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("hielitosUserId", user.ID_Usuario);
    localStorage.setItem("hielitosUserName", user.Nombre);
  };

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("hielitosUserId");
    localStorage.removeItem("hielitosUserName");
    setView("pos");
    setMenuOpen(false);
  }, []);

  // Auto-logout tras 5 min inactivo
  useEffect(() => {
    if (!currentUser) return;
    let timer = setTimeout(logout, 5 * 60 * 1000);
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 5 * 60 * 1000);
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [currentUser, logout]);

  return (
    <DatabaseProvider>
      <script src="https://cdn.tailwindcss.com"></script>
      {!currentUser ? (
        <LoginModule onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <Navbar
            setCurrentView={setView}
            userId={currentUser.Nombre}
            isMenuOpen={menuOpen}
            setIsMenuOpen={setMenuOpen}
            logout={logout}
          />
          <div className="container mx-auto px-4 py-6">
            {view === "users" && <UsersModule />}
            {view === "pos" && <POSModule />}
            {view === "flavors" && <FlavorsModule />}
            {view === "inventory" && <InventoryModule />}
            {view === "reports" && <ReportsModule />}
            {view === "trends" && <TrendsModule />}
          </div>
        </div>
      )}
    </DatabaseProvider>
  );
}
