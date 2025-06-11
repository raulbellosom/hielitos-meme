// src/components/FlavorsModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

export default function FlavorsModule() {
  const db = useContext(DatabaseContext);

  const [flavors, setFlavors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [isEditingFlavor, setIsEditingFlavor] = useState(false);
  const [currentFlavor, setCurrentFlavor] = useState(null);
  const [newFlavor, setNewFlavor] = useState({
    Nombre_Sabor: "",
    ID_Categoria: "",
    Precio: "",
    Color: "#ffffff",
    Activo: true,
    Nombre_Categoria: "",
    Initial_Inventario: "",
    Imagen_URL: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPrice, setNewCategoryPrice] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Carga inicial
  useEffect(() => {
    (async () => {
      const cats = await db.getCategorias();
      const fls = await db.getSabores();
      const movs = await db.getMovimientos();
      setCategories(cats);
      setFlavors(fls);
      setInventoryMovements(movs);
    })();
  }, [db]);

  // Inventario actual de un sabor
  const getInventoryForFlavor = (flavorId) =>
    inventoryMovements
      .filter((m) => m.ID_Sabor === flavorId)
      .reduce(
        (sum, m) =>
          sum + (m.Tipo_Movimiento === "Entrada" ? m.Cantidad : -m.Cantidad),
        0
      );

  // Mensaje temporal
  const displayMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Formularios ------------------------------------------------

  const handleFlavorChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFlavor((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "Initial_Inventario"
          ? value === ""
            ? ""
            : parseInt(value) || 0
          : value,
    }));
  };

  const handleCategorySelect = (e) => {
    const cid = e.target.value;
    if (cid === "_new_") {
      setNewFlavor((p) => ({ ...p, ID_Categoria: "_new_" }));
      setShowCategoryModal(true);
    } else {
      const cat = categories.find((c) => c.ID_Categoria === cid);
      setNewFlavor((prev) => ({
        ...prev,
        ID_Categoria: cid,
        Nombre_Categoria: cat?.Nombre_Categoria || "",
        Precio: cat && cat.Precio_Base != null ? cat.Precio_Base : prev.Precio,
      }));
    }
  };

  // ------------------ Categoría Rápida -----------------------

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) {
      displayMessage("Nombre de categoría vacío.", "error");
      return;
    }
    const price = newCategoryPrice !== "" ? parseFloat(newCategoryPrice) : null;
    try {
      // Verificar duplicado
      if (categories.some((c) => c.Nombre_Categoria === newCategoryName)) {
        displayMessage("Categoría ya existe.", "error");
        return;
      }
      const id = await db.addCategoria({
        Nombre_Categoria: newCategoryName,
        Precio_Base: price,
        Parent_ID_Categoria: null,
      });
      // Seleccionar nueva en el form de flavor
      setNewFlavor((prev) => ({
        ...prev,
        ID_Categoria: id,
        Nombre_Categoria: newCategoryName,
        Precio: price != null ? price : prev.Precio,
      }));
      setCategories(await db.getCategorias());
      setNewCategoryName("");
      setNewCategoryPrice("");
      displayMessage("Categoría creada y seleccionada.", "success");
    } catch {
      displayMessage("Error al crear categoría.", "error");
    }
  };

  // ------------------ Guardar / Editar Flavor ----------------

  const resetFlavorForm = () => {
    setNewFlavor({
      Nombre_Sabor: "",
      ID_Categoria: "",
      Precio: "",
      Color: "#ffffff",
      Activo: true,
      Nombre_Categoria: "",
      Initial_Inventario: "",
      Imagen_URL: "",
    });
    setIsEditingFlavor(false);
    setCurrentFlavor(null);
  };

  const handleAddOrUpdateFlavor = async () => {
    const f = newFlavor;
    if (
      !f.Nombre_Sabor ||
      !f.ID_Categoria ||
      f.ID_Categoria === "_new_" ||
      !f.Precio ||
      isNaN(parseFloat(f.Precio))
    ) {
      displayMessage("Completa Nombre, Categoría y Precio.", "error");
      return;
    }
    try {
      if (isEditingFlavor) {
        // update
        await db.updateSabor({
          ID_Sabor: currentFlavor.ID_Sabor,
          Nombre_Sabor: f.Nombre_Sabor,
          ID_Categoria: f.ID_Categoria,
          Precio: parseFloat(f.Precio),
          Color: f.Color,
          Activo: f.Activo,
          Imagen_URL: f.Imagen_URL,
        });
        // ajuste de inventario
        const stock = getInventoryForFlavor(currentFlavor.ID_Sabor);
        const target = parseInt(f.Initial_Inventario) || 0;
        const delta = target - stock;
        if (delta !== 0) {
          await db.addMovimiento({
            ID_Sabor: currentFlavor.ID_Sabor,
            Tipo_Movimiento:
              delta > 0 ? "Entrada" : "Salida automática por venta",
            Cantidad: Math.abs(delta),
            Observaciones: `Ajuste manual (${stock}→${target})`,
          });
        }
        displayMessage("Sabor actualizado.", "success");
      } else {
        // add
        const id = await db.addSabor({
          Nombre_Sabor: f.Nombre_Sabor,
          ID_Categoria: f.ID_Categoria,
          Precio: parseFloat(f.Precio),
          Color: f.Color,
          Activo: f.Activo,
          Imagen_URL: f.Imagen_URL,
        });
        // inventario inicial
        const init = parseInt(f.Initial_Inventario) || 0;
        if (init > 0) {
          await db.addMovimiento({
            ID_Sabor: id,
            Tipo_Movimiento: "Entrada",
            Cantidad: init,
            Observaciones: `Inventario inicial`,
          });
        }
        displayMessage("Sabor añadido.", "success");
      }
      setFlavors(await db.getSabores());
      setInventoryMovements(await db.getMovimientos());
      setShowFlavorModal(false);
      resetFlavorForm();
    } catch {
      displayMessage("Error al guardar sabor.", "error");
    }
  };

  const handleEditFlavor = (fl) => {
    setCurrentFlavor(fl);
    setNewFlavor({
      Nombre_Sabor: fl.Nombre_Sabor,
      ID_Categoria: fl.ID_Categoria,
      Precio: fl.Precio,
      Color: fl.Color,
      Activo: fl.Activo,
      Nombre_Categoria: fl.Nombre_Categoria,
      Initial_Inventario: getInventoryForFlavor(fl.ID_Sabor),
      Imagen_URL: fl.Imagen_URL,
    });
    setIsEditingFlavor(true);
    setShowFlavorModal(true);
  };

  const handleDeleteFlavor = async (id) => {
    if (!confirm("Eliminar este sabor?")) return;
    try {
      await db.deleteSabor(id);
      setFlavors(await db.getSabores());
      displayMessage("Sabor eliminado.", "success");
    } catch {
      displayMessage("Error al eliminar.", "error");
    }
  };

  // ------------------ Categorías Modal -----------------------

  const resetCategoryForm = () => {
    setNewCategoryName("");
    setNewCategoryPrice("");
    setCurrentCategory(null);
    setIsEditingCategory(false);
  };

  const handleSaveCategory = async () => {
    const name = newCategoryName.trim();
    const price = newCategoryPrice === "" ? null : parseFloat(newCategoryPrice);
    if (!name) {
      displayMessage("Nombre vacío.", "error");
      return;
    }
    try {
      if (isEditingCategory) {
        await db.updateCategoria({
          ID_Categoria: currentCategory.ID_Categoria,
          Nombre_Categoria: name,
          Precio_Base: price,
          Parent_ID_Categoria: null,
        });
        displayMessage("Categoría actualizada.", "success");
      } else {
        // evitar duplicados
        if (categories.some((c) => c.Nombre_Categoria === name)) {
          displayMessage("Categoría existe.", "error");
          return;
        }
        await db.addCategoria({
          Nombre_Categoria: name,
          Precio_Base: price,
          Parent_ID_Categoria: null,
        });
        displayMessage("Categoría añadida.", "success");
      }
      setCategories(await db.getCategorias());
      setShowCategoryModal(false);
      resetCategoryForm();
    } catch {
      displayMessage("Error al guardar categoría.", "error");
    }
  };

  const handleEditCategory = (cat) => {
    setCurrentCategory(cat);
    setNewCategoryName(cat.Nombre_Categoria);
    setNewCategoryPrice(cat.Precio_Base != null ? String(cat.Precio_Base) : "");
    setIsEditingCategory(true);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Eliminar esta categoría?")) return;
    try {
      await db.deleteCategoria(id);
      setCategories(await db.getCategorias());
      displayMessage("Categoría eliminada.", "success");
    } catch {
      displayMessage("Error al eliminar categoría.", "error");
    }
  };

  // ----------------------------------------------------------------
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-bold mb-6">Gestión de Sabores 🍦</h2>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded-lg text-white ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            resetFlavorForm();
            setShowFlavorModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Añadir Sabor
        </button>
        <button
          onClick={() => {
            resetCategoryForm();
            setShowCategoryModal(true);
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Gestionar Categorías
        </button>
      </div>

      <h3 className="text-2xl font-bold mb-4">Sabores</h3>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left">Sabor</th>
              <th className="py-3 px-4 text-left">Categoría</th>
              <th className="py-3 px-4 text-left">Precio</th>
              <th className="py-3 px-4 text-left">Inventario</th>
              <th className="py-3 px-4 text-left">Activo</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {flavors.map((fl) => (
              <tr key={fl.ID_Sabor} className="hover:bg-gray-50">
                <td className="py-3 px-4">{fl.Nombre_Sabor}</td>
                <td className="py-3 px-4">{fl.Nombre_Categoria}</td>
                <td className="py-3 px-4">${fl.Precio.toFixed(2)}</td>
                <td className="py-3 px-4 font-semibold">
                  {getInventoryForFlavor(fl.ID_Sabor)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      fl.Activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {fl.Activo ? "Sí" : "No"}
                  </span>
                </td>
                <td className="py-3 px-4 space-x-2">
                  <button
                    onClick={() => handleEditFlavor(fl)}
                    className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteFlavor(fl.ID_Sabor)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {flavors.length === 0 && (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  No hay sabores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Añadir/Editar Sabor */}
      {showFlavorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">
              {isEditingFlavor ? "Editar Sabor" : "Añadir Nuevo Sabor"}
            </h3>
            {/* --- Formulario --- */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Nombre</label>
                <input
                  name="Nombre_Sabor"
                  value={newFlavor.Nombre_Sabor}
                  onChange={handleFlavorChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <select
                  name="ID_Categoria"
                  value={newFlavor.ID_Categoria}
                  onChange={handleCategorySelect}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Selecciona...</option>
                  <option value="_new_">-- Crear Nueva Categoria --</option>
                  {categories.map((c) => (
                    <option key={c.ID_Categoria} value={c.ID_Categoria}>
                      {c.Nombre_Categoria}
                    </option>
                  ))}
                </select>
              </div>
              {newFlavor.ID_Categoria === "_new_" && (
                <div className="bg-gray-100 p-4 rounded space-y-2">
                  <div>
                    <label className="block mb-1">Nombre Categoría</label>
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Precio Base (opc.)</label>
                    <input
                      value={newCategoryPrice}
                      onChange={(e) => setNewCategoryPrice(e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <button
                    onClick={handleQuickAddCategory}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    Crear y Seleccionar
                  </button>
                </div>
              )}
              <div>
                <label className="block font-semibold mb-1">Precio</label>
                <input
                  name="Precio"
                  value={newFlavor.Precio}
                  onChange={handleFlavorChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Color</label>
                <input
                  type="color"
                  name="Color"
                  value={newFlavor.Color}
                  onChange={handleFlavorChange}
                  className="w-16 h-10 p-1 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Imagen URL (opc.)
                </label>
                <input
                  name="Imagen_URL"
                  value={newFlavor.Imagen_URL}
                  onChange={handleFlavorChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Inventario Inicial (opc.)
                </label>
                <input
                  name="Initial_Inventario"
                  value={newFlavor.Initial_Inventario}
                  onChange={handleFlavorChange}
                  className="w-full border p-2 rounded"
                  placeholder={
                    isEditingFlavor
                      ? `Actual: ${getInventoryForFlavor(
                          currentFlavor?.ID_Sabor
                        )}`
                      : ""
                  }
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="Activo"
                  checked={newFlavor.Activo}
                  onChange={handleFlavorChange}
                  className="mr-2"
                />
                <label>Activo</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowFlavorModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrUpdateFlavor}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isEditingFlavor ? "Guardar Cambios" : "Añadir Sabor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categorías */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-4">
              {isEditingCategory ? "Editar Categoría" : "Añadir Categoría"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">
                  Nombre de Categoría
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">
                  Precio Base (opc.)
                </label>
                <input
                  value={newCategoryPrice}
                  onChange={(e) => setNewCategoryPrice(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {isEditingCategory ? "Guardar Cambios" : "Añadir Categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
