/*
 * iniciosesion.js - RF01 (inicio de sesión) y RNF06 (bloqueo tras 5 intentos)
 * Prototipo: las credenciales se verifican aquí. En el proyecto real se enviarían
 * con POST /api/auth/login y el backend respondería 200 (ok), 401 (datos incorrectos)
 * o 423 (cuenta bloqueada).
 */
const USUARIO_DEMO = { correo: "ventas@bochito.mx", contrasena: "Bochito#2026!" };
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 5;
const CLAVE_BLOQUEO = "bochito_bloqueo";

const form = document.getElementById("formLogin");
const correo = document.getElementById("correo");
const contrasena = document.getElementById("contrasena");
const alerta = document.getElementById("alertaLogin");
const btnEntrar = document.getElementById("btnEntrar");

// ---- Control de intentos (se guarda para que sobreviva a recargar la página) ----
function leerBloqueo() {
  try { return JSON.parse(localStorage.getItem(CLAVE_BLOQUEO)) || { intentos: 0, hasta: 0 }; }
  catch { return { intentos: 0, hasta: 0 }; }
}
function guardarBloqueo(b) {
  try { localStorage.setItem(CLAVE_BLOQUEO, JSON.stringify(b)); } catch { /* sin almacenamiento */ }
}

function mostrarAlerta(texto, tipo) {
  alerta.textContent = texto;
  alerta.className = `alert alert-${tipo}`;
}

/** Devuelve los minutos que faltan si la cuenta está bloqueada, o 0 si no. */
function minutosRestantes() {
  const { hasta } = leerBloqueo();
  return hasta > Date.now() ? Math.ceil((hasta - Date.now()) / 60000) : 0;
}

function actualizarEstadoFormulario() {
  const min = minutosRestantes();
  btnEntrar.disabled = min > 0;
  if (min > 0) mostrarAlerta(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${min} min.`, "danger");
}

// Mostrar/ocultar contraseña
document.getElementById("verContrasena").addEventListener("click", (e) => {
  const visible = contrasena.type === "text";
  contrasena.type = visible ? "password" : "text";
  e.currentTarget.querySelector("i").className = visible ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (minutosRestantes() > 0) return actualizarEstadoFormulario();

  // 1) Validación del formato (Bootstrap marca los campos con .is-invalid)
  const okCorreo = correo.checkValidity();
  const okPass = contrasena.value.length > 0;
  correo.classList.toggle("is-invalid", !okCorreo);
  contrasena.classList.toggle("is-invalid", !okPass);
  if (!okCorreo || !okPass) return;

  // 2) Verificación de credenciales
  const datosOk = correo.value.trim().toLowerCase() === USUARIO_DEMO.correo && contrasena.value === USUARIO_DEMO.contrasena;
  if (datosOk) {
    guardarBloqueo({ intentos: 0, hasta: 0 });
    Bochito.iniciarSesion({ correo: USUARIO_DEMO.correo });
    mostrarAlerta("Acceso correcto. Redirigiendo...", "success");
    setTimeout(() => (window.location.href = "pedidos.html"), 600);
    return;
  }

  // 3) Datos incorrectos: contar el intento y bloquear si llega al máximo
  const b = leerBloqueo();
  b.intentos += 1;
  if (b.intentos >= MAX_INTENTOS) {
    b.hasta = Date.now() + MINUTOS_BLOQUEO * 60000;
    b.intentos = 0;
    guardarBloqueo(b);
    contrasena.value = "";
    return actualizarEstadoFormulario();
  }
  guardarBloqueo(b);
  mostrarAlerta(`Correo o contraseña incorrectos. Te quedan ${MAX_INTENTOS - b.intentos} intento(s).`, "danger");
});

// Si ya hay sesión, ir directo a pedidos
if (Bochito.getSesion()) window.location.href = "pedidos.html";
actualizarEstadoFormulario();
