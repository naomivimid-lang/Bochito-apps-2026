/*
 * datos.js - Datos y sesión compartidos (prototipo)
 * Lo usan iniciosesion.html, pedidos.html y productos.html.
 * En el proyecto real esto lo reemplaza el backend (API REST + base de datos).
 * Aquí los pedidos se guardan en localStorage y la sesión en sessionStorage.
 */
const Bochito = (() => {
  const ESTADOS = ["Orden recibida", "En fabricación", "Control de calidad", "Empaquetado", "En tránsito"];
  const COLOR_ESTATUS = {
    "Orden recibida": "secondary",
    "En fabricación": "warning",
    "Control de calidad": "info",
    Empaquetado: "primary",
    "En tránsito": "success",
  };
  const CLAVE_PEDIDOS = "bochito_pedidos";
  const CLAVE_SESION = "bochito_sesion";

  const PEDIDOS_INICIALES = [
    { id: 1, po: "PO-2026-0001", cliente: "Frutería Don Chuy", producto: "Huacales de madera", cantidad: 120, entrega: "2026-10-15T10:00", estatus: "Orden recibida", incidencias: [] },
    { id: 2, po: "PO-2026-0002", cliente: "Artesanías Raíces", producto: "Cajas de embalaje", cantidad: 60, entrega: "2026-10-18T12:00", estatus: "En fabricación", incidencias: [] },
    { id: 3, po: "PO-2026-0003", cliente: "Abarrotes La Esperanza", producto: "Bolsas de papel kraft", cantidad: 2000, entrega: "2026-10-12T09:00", estatus: "Control de calidad", incidencias: [] },
    { id: 4, po: "PO-2026-0004", cliente: "Verduras Hernández", producto: "Rejas plásticas", cantidad: 80, entrega: "2026-09-30T16:00", estatus: "Empaquetado", incidencias: [] },
    { id: 5, po: "PO-2026-0005", cliente: "Cooperativa Sierra Verde", producto: "Etiquetas adhesivas", cantidad: 5000, entrega: "2026-09-20T11:00", estatus: "En tránsito", incidencias: [] },
  ];

  // ---- Almacenamiento seguro (puede fallar en modo privado) ----
  const leer = (almacen, clave) => {
    try { return JSON.parse(almacen.getItem(clave)); } catch { return null; }
  };
  const guardar = (almacen, clave, valor) => {
    try { almacen.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  };

  // ---- Pedidos ----
  function getPedidos() {
    const guardados = leer(localStorage, CLAVE_PEDIDOS);
    if (Array.isArray(guardados)) return guardados;
    guardar(localStorage, CLAVE_PEDIDOS, PEDIDOS_INICIALES);
    return structuredClone(PEDIDOS_INICIALES);
  }
  function savePedidos(lista) { guardar(localStorage, CLAVE_PEDIDOS, lista); }

  function agregarPedido({ cliente, producto, cantidad, entrega }) {
    const lista = getPedidos();
    const id = lista.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const pedido = {
      id,
      po: `PO-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`,
      cliente, producto, cantidad, entrega,
      estatus: ESTADOS[0], // todo pedido nuevo inicia como "Orden recibida"
      incidencias: [],
    };
    lista.push(pedido);
    savePedidos(lista);
    return pedido;
  }

  // ---- Sesión ----
  const getSesion = () => leer(sessionStorage, CLAVE_SESION);
  const iniciarSesion = (usuario) => guardar(sessionStorage, CLAVE_SESION, usuario);
  const cerrarSesion = () => { try { sessionStorage.removeItem(CLAVE_SESION); } catch { /* nada */ } };

  /** Si no hay sesión, manda a iniciosesion.html. Devuelve el usuario o null. */
  function requerirSesion() {
    const s = getSesion();
    if (!s) { window.location.href = "iniciosesion.html"; return null; }
    return s;
  }

  // ---- Utilidades de interfaz ----
  const formatoFecha = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  };

  /** Crea <td> con texto plano (textContent evita inyectar HTML). */
  function celda(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
  }
  /** Crea <td> con la etiqueta de color del estatus. */
  function celdaEstatus(estatus) {
    const td = document.createElement("td");
    const b = document.createElement("span");
    b.className = `badge text-bg-${COLOR_ESTATUS[estatus] || "secondary"}`;
    b.textContent = estatus;
    td.appendChild(b);
    return td;
  }

  /** Botón "Cerrar sesión" y nombre del usuario en las páginas protegidas. */
  function activarBarraSesion(sesion) {
    const nombre = document.getElementById("usuarioActual");
    if (nombre) nombre.textContent = sesion.correo;
    const salir = document.getElementById("btnSalir");
    if (salir) salir.addEventListener("click", () => { cerrarSesion(); window.location.href = "iniciosesion.html"; });
  }

  return { ESTADOS, getPedidos, savePedidos, agregarPedido, getSesion, iniciarSesion, cerrarSesion,
           requerirSesion, formatoFecha, celda, celdaEstatus, activarBarraSesion };
})();
