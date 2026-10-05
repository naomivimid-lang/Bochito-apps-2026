const USAR_SIMULACION = true;
const API_URL = "http://localhost:3000";

// Estados válidos definidos por el sistema
const ESTADOS = [
  "Orden recibida",
  "En fabricación",
  "Control de calidad",
  "Empaquetado",
  "En tránsito",
];

const COLOR_ESTATUS = {
  "Orden recibida": "secondary",
  "En fabricación": "warning",
  "Control de calidad": "info",
  Empaquetado: "primary",
  "En tránsito": "success",
};

// Pedidos de ejemplo (solo para el prototipo)
let pedidos = [
  { id: 1, cliente: "Frutería Don Chuy", producto: "Huacales de madera", cantidad: 120, entrega: "2026-10-10", estatus: "Orden recibida" },
  { id: 2, cliente: "Artesanías Raíces", producto: "Cajas de embalaje", cantidad: 60, entrega: "2026-10-12", estatus: "En fabricación" },
  { id: 3, cliente: "Abarrotes La Esperanza", producto: "Bolsas de papel kraft", cantidad: 2000, entrega: "2026-10-09", estatus: "Control de calidad" },
  { id: 4, cliente: "Verduras Hernández", producto: "Rejas plásticas", cantidad: 80, entrega: "2026-10-08", estatus: "Empaquetado" },
  { id: 5, cliente: "Cooperativa Sierra Verde", producto: "Etiquetas adhesivas", cantidad: 5000, entrega: "2026-10-14", estatus: "En tránsito" },
];

const tabla = document.getElementById("tablaPedidos");
const sinPedidos = document.getElementById("sinPedidos");
const filtro = document.getElementById("filtroEstatus");
const mensaje = document.getElementById("mensaje");
const modalEl = document.getElementById("modalEstatus");
const modal = new bootstrap.Modal(modalEl);
const formEstatus = document.getElementById("formEstatus");
const selectNuevo = document.getElementById("nuevoEstatus");
const modalPedido = document.getElementById("modalPedido");
const modalError = document.getElementById("modalError");
let pedidoActual = null;

async function actualizarEstatusAPI(id, estatus) {
  if (!USAR_SIMULACION) {
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus }),
      });
      const body = await res.json().catch(() => ({}));
      return { status: res.status, body };
    } catch (e) {
      return { status: 0, body: { mensaje: "No se pudo conectar con el servidor." } };
    }
  }

  await new Promise((r) => setTimeout(r, 300));
  if (!ESTADOS.includes(estatus)) {
    return { status: 400, body: { exito: false, error: "ESTATUS_INVALIDO", mensaje: "El estatus no es válido." } };
  }
  const pedido = pedidos.find((p) => p.id === Number(id));
  if (!pedido) {
    return { status: 404, body: { exito: false, error: "PEDIDO_NO_ENCONTRADO", mensaje: "El pedido no existe." } };
  }
  pedido.estatus = estatus;
  return { status: 200, body: { exito: true, mensaje: "Estatus actualizado correctamente.", pedido: { ...pedido } } };
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
}

function dibujarTabla() {
  const lista = pedidos.filter((p) => !filtro.value || p.estatus === filtro.value);
  tabla.innerHTML = "";
  lista.forEach((p) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>#${p.id}</td>
      <td></td>
      <td></td>
      <td>${p.cantidad}</td>
      <td>${p.entrega}</td>
      <td><span class="badge text-bg-${COLOR_ESTATUS[p.estatus]}">${p.estatus}</span></td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm" data-id="${p.id}">Actualizar estatus</button>
      </td>`;
    // textContent evita insertar HTML de los datos
    fila.children[1].textContent = p.cliente;
    fila.children[2].textContent = p.producto;
    tabla.appendChild(fila);
  });
  sinPedidos.classList.toggle("d-none", lista.length > 0);
}

function llenarSelects() {
  ESTADOS.forEach((e) => {
    filtro.add(new Option(e, e));
    selectNuevo.add(new Option(e, e));
  });
}

tabla.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  pedidoActual = pedidos.find((p) => p.id === Number(btn.dataset.id));
  modalPedido.textContent = `Pedido #${pedidoActual.id} · ${pedidoActual.producto} (actual: ${pedidoActual.estatus})`;
  selectNuevo.value = pedidoActual.estatus;
  modalError.classList.add("d-none");
  modal.show();
});

formEstatus.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevo = selectNuevo.value;
  if (!ESTADOS.includes(nuevo)) {
    modalError.textContent = "Selecciona un estatus válido.";
    modalError.classList.remove("d-none");
    return;
  }

  const { status, body } = await actualizarEstatusAPI(pedidoActual.id, nuevo);

  if (status === 200 && body.exito) {
    pedidoActual.estatus = body.pedido.estatus;
    modal.hide();
    dibujarTabla();
    mostrarMensaje(body.mensaje, "success");
  } else {
    modalError.textContent = body.mensaje || `Error inesperado (${status}).`;
    modalError.classList.remove("d-none");
  }
});

filtro.addEventListener("change", dibujarTabla);

llenarSelects();
dibujarTabla();
