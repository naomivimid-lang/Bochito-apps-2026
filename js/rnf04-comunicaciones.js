
const campoOperacion = document.getElementById("operacion");
const botonAgregar = document.getElementById("agregar");
const botonReintentar = document.getElementById("reintentar");
const estado = document.getElementById("estado");
const lista = document.getElementById("listaSolicitudes");

const solicitudes = [];

botonAgregar.addEventListener("click", function () {
    const descripcion = campoOperacion.value.trim();

    if (!descripcion) {
        estado.textContent = "Escribe una descripción antes de agregar.";
        campoOperacion.focus();
        return;
    }

    solicitudes.push({
        descripcion: descripcion,
        intentos: 0
    });

    campoOperacion.value = "";
    mostrarSolicitudes();
    estado.textContent = "Solicitud agregada a la cola de demostración.";
});

botonReintentar.addEventListener("click", function () {
    if (solicitudes.length === 0) {
        estado.textContent = "No hay solicitudes pendientes para reintentar.";
        return;
    }

    solicitudes.forEach(function (solicitud) {
        solicitud.intentos++;
    });

    mostrarSolicitudes();
    estado.textContent =
        "Se simuló un reintento para las solicitudes pendientes.";
});

function mostrarSolicitudes() {
    lista.replaceChildren();

    solicitudes.forEach(function (solicitud) {
        const elemento = document.createElement("li");

        elemento.textContent =
            `${solicitud.descripcion} — Intentos simulados: ${solicitud.intentos}`;

        lista.appendChild(elemento);
    });
}
