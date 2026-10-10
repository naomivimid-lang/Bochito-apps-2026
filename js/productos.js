const USAR_SIMULACION = true;
const API_URL = "http://localhost:3000";

// RF03: actualizar estatus. Solo personal con sesión; los datos son los mismos
// que usa pedidos.html (js/datos.js).
const sesion = Bochito.requerirSesion();
if (sesion) Bochito.activarBarraSesion(sesion);

const ESTADOS = Bochito.ESTADOS;
let pedidos = Bochito.getPedidos();

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
  Bochito.savePedidos(pedidos);
  return { status: 200, body: { exito: true, mensaje: "Estatus actualizado correctamente.", pedido: { ...pedido } } };
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
}

function dibujarTabla() {
  const po = document.getElementById("filtroPo").value.trim().toLowerCase();
  const desde = document.getElementById("filtroDesde").value;
  const hastaEl = document.getElementById("filtroHasta");
  const hasta = hastaEl.value;
  const fechasMal = Boolean(desde && hasta && desde > hasta);
  hastaEl.classList.toggle("is-invalid", fechasMal);
  if (fechasMal) return;

  const lista = pedidos.filter((p) => {
    const dia = p.entrega.slice(0, 10); // yyyy-MM-dd, comparable como texto
    return (!po || p.po.toLowerCase().includes(po)) &&
           (!filtro.value || p.estatus === filtro.value) &&
           (!desde || dia >= desde) &&
           (!hasta || dia <= hasta);
  });
  tabla.innerHTML = "";
  lista.forEach((p) => {
    const fila = document.createElement("tr");
    fila.append(
      Bochito.celda(p.po), Bochito.celda(p.cliente), Bochito.celda(p.producto),
      Bochito.celda(p.cantidad), Bochito.celda(Bochito.formatoFecha(p.entrega)),
      Bochito.celdaEstatus(p.estatus)
    );
    const acciones = document.createElement("td");
    acciones.className = "text-end";
    acciones.innerHTML = `<button class="btn btn-outline-primary btn-sm" data-id="${p.id}">Actualizar estatus</button>`;
    fila.appendChild(acciones);
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
  modalPedido.textContent = `${pedidoActual.po} · ${pedidoActual.producto} (actual: ${pedidoActual.estatus})`;
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

document.getElementById("filtros").addEventListener("input", dibujarTabla);

llenarSelects();
if (sesion) dibujarTabla();
