// src/components/POSModule.jsx
import React, { useState, useEffect, useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext.jsx";

// Componente de teclado numérico virtual
const Numpad = ({ onInput, onClear, onDelete }) => {
  const buttons = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ".",
    "0",
    "del",
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mt-4 p-4 bg-gray-200 rounded-xl shadow-inner">
      {buttons.map((btn) => (
        <button
          key={btn}
          onClick={() => {
            if (btn === "del") onDelete();
            else if (btn === "C") onClear();
            else onInput(btn);
          }}
          className={`p-4 text-xl font-bold rounded-lg shadow-md
                    ${
                      btn === "."
                        ? "bg-gray-400 text-white"
                        : btn === "del"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-800"
                    }
                    hover:scale-105 transform transition duration-150 ease-in-out active:bg-gray-300`}
        >
          {btn === "del" ? "⌫" : btn}
        </button>
      ))}
      <button
        onClick={onClear}
        className="col-span-3 p-4 text-xl font-bold rounded-lg shadow-md bg-red-500 text-white
                   hover:scale-105 transform transition duration-150 ease-in-out active:bg-red-600"
      >
        C
      </button>
    </div>
  );
};

export default function POSModule() {
  const db = useContext(DatabaseContext);
  const [products, setProducts] = useState([]); // Todos los sabores
  const [categories, setCategories] = useState([]); // Categorías
  const [inventoryMovements, setInventoryMovements] = useState([]); // Movimientos
  const [currentTicket, setCurrentTicket] = useState([]); // Línea de venta
  const [paymentAmount, setPaymentAmount] = useState(""); // Monto pagado
  const [saleType, setSaleType] = useState("Normal"); // Normal | Descuento | Donacion
  const [message, setMessage] = useState({ text: "", type: "" }); // Mensajes de error/éxito
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    total: 0,
    received: 0,
    change: 0,
    discount: 0,
    fixedDiscount: 0,
  });
  const [selectedPercentageDiscount, setSelectedPercentageDiscount] =
    useState(0);
  const [manualFixedDiscount, setManualFixedDiscount] = useState("");

  // Mensaje temporal
  const displayMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Carga inicial desde SQLite en lugar de onSnapshot
  useEffect(() => {
    (async () => {
      const cats = await db.getCategorias();
      const prods = await db.getSabores();
      const movs = await db.getMovimientos();
      setCategories(cats);
      setProducts(prods);
      setInventoryMovements(movs);
    })();
  }, [db]);

  // Stock actual de un sabor
  const getInventoryForProduct = (productId) => {
    return inventoryMovements
      .filter((m) => m.ID_Sabor === productId)
      .reduce(
        (sum, m) =>
          sum +
          (m.Tipo_Movimiento.startsWith("Salida") ? -m.Cantidad : m.Cantidad),
        0
      );
  };

  // Detalles del producto
  const getProductDetails = (productId) =>
    products.find((p) => p.ID_Sabor === productId) || {};

  // Añade o actualiza ítem en ticket
  const addToTicket = (product) => {
    const stock = getInventoryForProduct(product.ID_Sabor);
    setCurrentTicket((prev) => {
      const idx = prev.findIndex((i) => i.ID_Sabor === product.ID_Sabor);
      if (idx > -1) {
        const newQty = prev[idx].Cantidad_Vendida + 1;
        if (newQty > stock) {
          displayMessage(
            `No hay suficiente inventario para ${product.Nombre_Sabor}. Stock: ${stock}`,
            "error"
          );
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          Cantidad_Vendida: newQty,
          Subtotal: newQty * product.Precio,
        };
        return updated;
      } else {
        if (stock <= 0) {
          displayMessage(`¡${product.Nombre_Sabor} está agotado!`, "error");
          return prev;
        }
        return [
          ...prev,
          {
            ID_Sabor: product.ID_Sabor,
            Nombre_Sabor: product.Nombre_Sabor,
            Cantidad_Vendida: 1,
            Precio_Unitario: product.Precio,
            Subtotal: product.Precio,
            Color: product.Color,
            Imagen_URL: product.Imagen_URL,
          },
        ];
      }
    });
  };

  // Actualiza cantidad desde input o botones
  const updateTicketItemQuantity = (productId, newQuantity) => {
    const stock = getInventoryForProduct(productId);
    if (newQuantity <= 0) {
      removeTicketItem(productId);
      return;
    }
    if (newQuantity > stock) {
      const prod = getProductDetails(productId);
      displayMessage(
        `Stock insuficiente para ${prod.Nombre_Sabor}. Stock: ${stock}`,
        "error"
      );
      return;
    }
    setCurrentTicket((prev) =>
      prev.map((item) =>
        item.ID_Sabor === productId
          ? {
              ...item,
              Cantidad_Vendida: newQuantity,
              Subtotal: newQuantity * item.Precio_Unitario,
            }
          : item
      )
    );
  };

  const removeTicketItem = (productId) =>
    setCurrentTicket((prev) =>
      prev.filter((item) => item.ID_Sabor !== productId)
    );

  // Calcula subtotal sin descuentos
  const calculateSubtotal = () =>
    currentTicket.reduce((sum, item) => sum + item.Subtotal, 0);

  // Calcula total en vivo con descuentos seleccionados
  const calculateLiveTotalToPay = () => {
    const sub = calculateSubtotal();
    if (saleType === "Descuento") {
      if (manualFixedDiscount && parseFloat(manualFixedDiscount) > 0) {
        return Math.max(0, sub - parseFloat(manualFixedDiscount));
      }
      if (selectedPercentageDiscount > 0) {
        return Math.max(0, sub * (1 - selectedPercentageDiscount / 100));
      }
    }
    return sub;
  };

  // Calcula cambio en vivo
  const calculateLiveChange = () => {
    const total = calculateLiveTotalToPay();
    return (parseFloat(paymentAmount) || 0) - total;
  };

  const handleSaleTypeChange = (e) => {
    setSaleType(e.target.value);
    setSelectedPercentageDiscount(0);
    setManualFixedDiscount("");
    setPaymentAmount("");
  };

  // Procesa pago / abre modales
  const handleProcessPayment = () => {
    const sub = calculateSubtotal();
    if (!currentTicket.length) {
      displayMessage("No hay productos en el ticket.", "error");
      return;
    }
    if (sub <= 0 && saleType !== "Donacion") {
      displayMessage("El total debe ser mayor a cero.", "error");
      return;
    }
    if (saleType === "Descuento") return setShowDiscountModal(true);
    setPaymentDetails({
      total: sub,
      received: parseFloat(paymentAmount) || 0,
      change: calculateLiveChange(),
      discount: 0,
      fixedDiscount: 0,
    });
    setShowPaymentModal(true);
  };

  // Aplica descuento y abre modal de confirmación
  const applyDiscount = () => {
    const sub = calculateSubtotal();
    let fin = sub,
      pct = 0,
      fix = 0;
    if (manualFixedDiscount && parseFloat(manualFixedDiscount) > 0) {
      fix = parseFloat(manualFixedDiscount);
      fin = Math.max(0, sub - fix);
      pct = (fix / sub) * 100;
    } else {
      pct = selectedPercentageDiscount;
      fin = Math.max(0, sub * (1 - pct / 100));
    }
    setPaymentDetails({
      total: fin,
      received: parseFloat(paymentAmount) || 0,
      change: (parseFloat(paymentAmount) || 0) - fin,
      discount: pct,
      fixedDiscount: fix,
    });
    setShowDiscountModal(false);
    setShowPaymentModal(true);
  };

  // Confirma y guarda en SQLite (Ventas, Detalle, Movimientos_Inventario)
  const handleConfirmSale = async () => {
    const { total, received, discount, fixedDiscount } = paymentDetails;
    if (saleType !== "Donacion" && received < total) {
      displayMessage("Pago insuficiente.", "error");
      return;
    }
    try {
      const idVenta = await db.addVenta({
        Tipo_Venta: saleType,
        Total_Venta: saleType === "Donacion" ? received : total,
        Pago_Cliente: received,
        Cambio: saleType === "Donacion" ? 0 : received - total,
        Porcentaje_Descuento: discount,
        Monto_Descuento_Fijo: fixedDiscount,
      });
      for (let item of currentTicket) {
        await db.addDetalleVenta({
          ID_Venta: idVenta,
          ID_Sabor: item.ID_Sabor,
          Cantidad_Vendida: item.Cantidad_Vendida,
          Subtotal: item.Subtotal,
        });
        // Registro de salida de inventario
        await db.addMovimiento({
          ID_Sabor: item.ID_Sabor,
          Tipo_Movimiento: "Salida automática por venta",
          Cantidad: -item.Cantidad_Vendida,
          Observaciones: `Venta #${idVenta}`,
        });
      }
      displayMessage("Venta registrada con éxito.", "success");
      setCurrentTicket([]);
      setPaymentAmount("");
      setSaleType("Normal");
      setSelectedPercentageDiscount(0);
      setManualFixedDiscount("");
      setShowPaymentModal(false);
    } catch (e) {
      console.error(e);
      displayMessage("Error al registrar la venta.", "error");
    }
  };

  // Agrupa productos por categoría
  const available = products.filter(
    (p) => p.Activo && getInventoryForProduct(p.ID_Sabor) > 0
  );
  const groupedProducts = categories.reduce((acc, cat) => {
    const prods = available.filter((p) => p.ID_Categoria === cat.ID_Categoria);
    if (prods.length) acc[cat.ID_Categoria] = prods;
    return acc;
  }, {});

  // Render
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Mensaje */}
      {message.text && (
        <div
          className={`col-span-full p-3 rounded-lg text-white ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Caja */}
      <div className="lg:col-span-1 bg-blue-50 p-6 rounded-xl shadow-inner border border-blue-200 h-fit sticky top-4">
        <h2 className="text-3xl font-bold text-blue-800 mb-6">
          Ticket Actual 📄
        </h2>

        {!currentTicket.length ? (
          <p className="text-gray-600 italic mb-4">
            No hay productos en el ticket.
          </p>
        ) : (
          <div className="space-y-4 mb-6">
            {currentTicket.map((item) => (
              <div
                key={item.ID_Sabor}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border"
              >
                <div className="flex-1 pr-2 overflow-hidden">
                  <p className="font-semibold text-gray-800 truncate">
                    {item.Nombre_Sabor}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${item.Precio_Unitario.toFixed(2)} c/u
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      updateTicketItemQuantity(
                        item.ID_Sabor,
                        item.Cantidad_Vendida - 1
                      )
                    }
                    className="p-1 bg-red-400 text-white rounded w-6 h-6 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="font-bold w-6 text-center">
                    {item.Cantidad_Vendida}
                  </span>
                  <button
                    onClick={() =>
                      updateTicketItemQuantity(
                        item.ID_Sabor,
                        item.Cantidad_Vendida + 1
                      )
                    }
                    className="p-1 bg-green-400 text-white rounded w-6 h-6 flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="font-bold w-16 text-right">
                    ${item.Subtotal.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeTicketItem(item.ID_Sabor)}
                    className="p-1 bg-red-600 text-white rounded w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subtotales */}
        <div className="border-t-2 border-blue-300 pt-4 mb-2">
          <p className="flex justify-between text-gray-700 mb-1">
            <span>Subtotal:</span>{" "}
            <span>${calculateSubtotal().toFixed(2)}</span>
          </p>
          {(selectedPercentageDiscount > 0 ||
            (manualFixedDiscount && parseFloat(manualFixedDiscount) > 0)) && (
            <p className="flex justify-between text-green-700 mb-2">
              <span>Descuento:</span>
              <span>
                −
                {manualFixedDiscount
                  ? `$${parseFloat(manualFixedDiscount).toFixed(2)}`
                  : `${selectedPercentageDiscount}%`}
              </span>
            </p>
          )}
          <p className="flex justify-between text-xl font-bold text-blue-900">
            <span>Total a Pagar:</span>{" "}
            <span>${calculateLiveTotalToPay().toFixed(2)}</span>
          </p>
        </div>

        {/* Tipo de venta */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-semibold">
            Tipo de Venta
          </label>
          <select
            value={saleType}
            onChange={handleSaleTypeChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option>Normal</option>
            <option>Descuento</option>
            <option>Donacion</option>
          </select>
        </div>

        {/* Pago + Numpad */}
        {saleType !== "Donacion" && (
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Monto Pagado
            </label>
            <input
              type="text"
              readOnly
              value={paymentAmount}
              className="w-full p-3 border rounded-lg text-2xl font-bold bg-gray-50 mb-2"
              placeholder="0.00"
            />
            <Numpad
              onInput={(v) => {
                /* tu lógica de monto */ setPaymentAmount((prev) => {
                  if (v === "." && prev.includes(".")) return prev;
                  if (prev.includes(".")) {
                    const [i, d] = prev.split(".");
                    if (d.length >= 2) return prev;
                  }
                  return prev === "0" ? v : prev + v;
                });
              }}
              onClear={() => setPaymentAmount("")}
              onDelete={() => setPaymentAmount((prev) => prev.slice(0, -1))}
            />
          </div>
        )}

        {/* Cambio / Donación */}
        {saleType !== "Donacion" && paymentAmount && (
          <div className="mb-6 border-t-2 pt-2 border-gray-300">
            {parseFloat(paymentAmount) >= calculateLiveTotalToPay() ? (
              <p className="flex justify-between text-xl font-bold text-purple-700">
                <span>Cambio:</span>{" "}
                <span>${calculateLiveChange().toFixed(2)}</span>
              </p>
            ) : (
              <p className="flex justify-between text-lg font-bold text-red-700">
                <span>Faltante:</span>{" "}
                <span>
                  $
                  {(
                    calculateLiveTotalToPay() - (parseFloat(paymentAmount) || 0)
                  ).toFixed(2)}
                </span>
              </p>
            )}
          </div>
        )}
        {saleType === "Donacion" && (
          <div className="mb-6 border-t-2 pt-2 border-gray-300">
            <p className="flex justify-between text-xl font-bold text-purple-700">
              <span>Donación registrada por:</span>
              <span>${(parseFloat(paymentAmount) || 0).toFixed(2)}</span>
            </p>
          </div>
        )}

        {/* Botón Ir a Pagar */}
        <button
          onClick={handleProcessPayment}
          className="w-full py-4 bg-purple-600 text-white text-xl font-bold rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
        >
          Ir a Pagar
        </button>
      </div>

      {/* Selección de productos */}
      <div className="lg:col-span-2">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Seleccionar Productos 🛒
        </h2>
        {products.length === 0 ? (
          <p className="text-gray-600">
            No hay productos disponibles. Añade sabores primero.
          </p>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <p className="text-gray-600">No hay categorías con stock activo.</p>
        ) : (
          Object.entries(groupedProducts).map(([catId, prods]) => (
            <div key={catId} className="mb-8">
              <h3 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
                {
                  categories.find((c) => c.ID_Categoria === catId)
                    ?.Nombre_Categoria
                }
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {prods.map((prod) => (
                  <button
                    key={prod.ID_Sabor}
                    onClick={() => addToTicket(prod)}
                    disabled={getInventoryForProduct(prod.ID_Sabor) <= 0}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition transform hover:scale-105 ${
                      getInventoryForProduct(prod.ID_Sabor) <= 0
                        ? "opacity-60 border-2 border-red-400 cursor-not-allowed"
                        : "hover:shadow-lg"
                    }`}
                    style={{ backgroundColor: prod.Color, minHeight: "120px" }}
                  >
                    <span className="absolute top-2 left-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                      Stock: {getInventoryForProduct(prod.ID_Sabor)}
                    </span>
                    {prod.Imagen_URL && (
                      <img
                        src={prod.Imagen_URL}
                        alt=""
                        className="w-12 h-12 object-cover rounded-full mb-2 border-2 border-white shadow-md"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/48x48/cccccc/ffffff?text=🍦";
                        }}
                      />
                    )}
                    <span className="text-lg font-bold text-white text-center break-words mb-1">
                      {prod.Nombre_Sabor}
                    </span>
                    <span className="text-white text-opacity-90 font-semibold">
                      ${prod.Precio.toFixed(2)}
                    </span>
                    {currentTicket.find((i) => i.ID_Sabor === prod.ID_Sabor)
                      ?.Cantidad_Vendida > 0 && (
                      <span className="absolute bottom-2 right-2 bg-blue-700 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {
                          currentTicket.find(
                            (i) => i.ID_Sabor === prod.ID_Sabor
                          ).Cantidad_Vendida
                        }
                      </span>
                    )}
                    {getInventoryForProduct(prod.ID_Sabor) <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
                        <span className="text-white text-xl font-bold">
                          AGOTADO
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Confirmar Venta */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Confirmar Venta
            </h3>
            <div className="space-y-3 mb-6 text-lg">
              <p className="flex justify-between">
                <span>Subtotal Original:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </p>
              {paymentDetails.fixedDiscount > 0 && (
                <p className="flex justify-between">
                  <span>Descuento Fijo:</span>
                  <span className="text-green-700">
                    -${paymentDetails.fixedDiscount.toFixed(2)}
                  </span>
                </p>
              )}
              {paymentDetails.discount > 0 &&
                paymentDetails.fixedDiscount === 0 && (
                  <p className="flex justify-between">
                    <span>Descuento ({paymentDetails.discount}%):</span>
                    <span className="text-green-700">
                      - $
                      {(
                        (calculateSubtotal() * paymentDetails.discount) /
                        100
                      ).toFixed(2)}
                    </span>
                  </p>
                )}
              <p className="flex justify-between">
                <span>Total a pagar:</span>
                <span className="text-blue-700">
                  ${paymentDetails.total.toFixed(2)}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Monto recibido:</span>
                <span className="text-green-700">
                  ${paymentDetails.received.toFixed(2)}
                </span>
              </p>
              <p className="flex justify-between border-t pt-2 mt-2">
                <span>
                  {saleType === "Donacion"
                    ? "Donación registrada por:"
                    : "Cambio:"}
                </span>
                <span className="text-purple-700">
                  $
                  {saleType === "Donacion"
                    ? paymentDetails.received.toFixed(2)
                    : paymentDetails.change.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={
                  saleType !== "Donacion" &&
                  paymentDetails.received < paymentDetails.total
                }
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aplicar Descuento */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-2xl font-bold mb-6">Aplicar Descuento</h3>
            <p className="text-gray-700 mb-4">
              Subtotal: <strong>${calculateSubtotal().toFixed(2)}</strong>
            </p>
            <div className="mb-6">
              <p className="font-semibold mb-2">Seleccionar %:</p>
              <div className="flex justify-around">
                {[10, 20, 50].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPercentageDiscount(p);
                      setManualFixedDiscount("");
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      selectedPercentageDiscount === p
                        ? "bg-blue-700 text-white"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2">Descuento Fijo ($)</label>
              <input
                type="number"
                value={manualFixedDiscount}
                onChange={(e) => {
                  setManualFixedDiscount(e.target.value);
                  setSelectedPercentageDiscount(0);
                }}
                className="w-full p-3 border rounded-lg mb-1"
                placeholder="Ej: 5.00"
              />
              {manualFixedDiscount &&
                parseFloat(manualFixedDiscount) > calculateSubtotal() && (
                  <p className="text-red-500 text-xs">
                    No puede exceder el subtotal.
                  </p>
                )}
            </div>
            <p className="text-xl font-bold mb-6">
              Total con descuento: ${calculateLiveTotalToPay().toFixed(2)}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setSelectedPercentageDiscount(0);
                  setManualFixedDiscount("");
                }}
                className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={applyDiscount}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={
                  manualFixedDiscount &&
                  parseFloat(manualFixedDiscount) > calculateSubtotal()
                }
              >
                Aplicar Descuento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
