/*
 * pedidos.js - RF02 (registro de pedidos) y RF05 (registro de incidencias)
 * Requiere sesión iniciada. Usa Bochito (js/datos.js) para guardar los datos.
 * Endpoints equivalentes en el backend:
 *   POST /api/pedidos                      -> crear pedido
 *   POST /api/pedidos/:id/incidencias      -> registrar incidencia
 */
const sesion = Bochito.requerirSesion();
if (sesion) Bochito.activarBarraSesion(sesion);

const formPedido = document.getElementById("formPedido");
const tabla = document.getElementById("tablaPedidos");
const mensaje = document.getElementById("mensaje");
const modal = new bootstrap.Modal(document.getElementById("modalIncidencia"));
const formIncidencia = document.getElementById("formIncidencia");
let pedidoIncidencia = null;

// "yyyy-MM-ddTHH:mm" en hora local, para el atributo min de datetime-local
function ahoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
}

function dibujarTabla() {
  tabla.innerHTML = "";
  Bochito.getPedidos().forEach((p) => {
    const fila = document.createElement("tr");
    fila.append(
      Bochito.celda(p.po), Bochito.celda(p.cliente), Bochito.celda(p.producto),
      Bochito.celda(p.cantidad), Bochito.celda(Bochito.formatoFecha(p.entrega)),
      Bochito.celdaEstatus(p.estatus)
    );
    const acciones = document.createElement("td");
    acciones.className = "text-end text-nowrap";
    if (p.incidencias.length) {
      const aviso = document.createElement("span");
      aviso.className = "badge text-bg-warning me-2";
      aviso.textContent = `${p.incidencias.length} incidencia(s)`;
      acciones.appendChild(aviso);
    }
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary btn-sm";
    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Incidencia';
    btn.addEventListener("click", () => abrirIncidencia(p));
    acciones.appendChild(btn);
    fila.appendChild(acciones);
    tabla.appendChild(fila);
  });
}

// ---- RF02: registrar pedido ----
document.getElementById("entrega").min = ahoraLocal();

formPedido.addEventListener("submit", (e) => {
  e.preventDefault();
  const campos = ["cliente", "producto", "cantidad", "entrega"].map((id) => document.getElementById(id));
  let valido = true;
  campos.forEach((c) => {
    let ok = c.checkValidity() && c.value.trim() !== "";
    if (c.id === "cantidad") ok = ok && Number.isInteger(Number(c.value)) && Number(c.value) > 0;
    if (c.id === "entrega") ok = ok && new Date(c.value) > new Date(); // debe ser futura
    c.classList.toggle("is-invalid", !ok);
    valido = valido && ok;
  });
  if (!valido) return mostrarMensaje("Revisa los campos marcados.", "danger");

  const [cliente, producto, cantidad, entrega] = campos;
  const nuevo = Bochito.agregarPedido({
    cliente: cliente.value.trim(), producto: producto.value.trim(),
    cantidad: Number(cantidad.value), entrega: entrega.value,
  });
  formPedido.reset();
  campos.forEach((c) => c.classList.remove("is-invalid"));
  mostrarMensaje(`Pedido ${nuevo.po} registrado con estatus "${nuevo.estatus}".`, "success");
  dibujarTabla();
});

// ---- RF05: registrar incidencia ----
function abrirIncidencia(pedido) {
  pedidoIncidencia = pedido;
  document.getElementById("incidenciaPedido").textContent = `${pedido.po} · ${pedido.cliente} · ${pedido.producto}`;
  formIncidencia.reset();
  formIncidencia.querySelectorAll(".is-invalid").forEach((c) => c.classList.remove("is-invalid"));
  document.getElementById("nuevaFecha").min = ahoraLocal();
  modal.show();
}

formIncidencia.addEventListener("submit", (e) => {
  e.preventDefault();
  const tipo = document.getElementById("tipoIncidencia");
  const causa = document.getElementById("causaIncidencia");
  const fecha = document.getElementById("nuevaFecha");
  const oks = [tipo.value !== "", causa.value.trim().length >= 5, fecha.value !== "" && new Date(fecha.value) > new Date()];
  [tipo, causa, fecha].forEach((c, i) => c.classList.toggle("is-invalid", !oks[i]));
  if (!oks.every(Boolean)) return;

  const lista = Bochito.getPedidos();
  const p = lista.find((x) => x.id === pedidoIncidencia.id);
  p.incidencias.push({ tipo: tipo.value, causa: causa.value.trim(), nuevaFecha: fecha.value, registrada: new Date().toISOString() });
  p.entrega = fecha.value; // la nueva fecha estimada reemplaza a la anterior
  Bochito.savePedidos(lista);
  modal.hide();
  dibujarTabla();
  // RF06 (notificación al cliente) se resolverá en el backend; aquí solo se informa.
  mostrarMensaje(`Incidencia registrada en ${p.po}. Se notificará al cliente.`, "warning");
});

if (sesion) dibujarTabla();
