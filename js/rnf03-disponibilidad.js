
const disponibilidadObjetivo = 99.9;
const diasDelAnio = 365;

// Calculamos el porcentaje de interrupción.
const porcentajeInterrupcion = 100 - disponibilidadObjetivo;

// Calculamos los segundos de interrupción anuales.
const segundosInterrupcion =
    diasDelAnio * 24 * 60 * 60 * porcentajeInterrupcion / 100;

// Convertimos los segundos a horas, minutos y segundos.
const horas = Math.floor(segundosInterrupcion / 3600);

const minutos = Math.floor(
    (segundosInterrupcion % 3600) / 60
);

const segundos = Math.round(segundosInterrupcion % 60);

// Mostramos el resultado en la página.
const elementoTiempo = document.getElementById("tiempoInterrupcion");

if (elementoTiempo) {
    elementoTiempo.textContent =
        `${horas} h ${minutos} min ${segundos} s`;
}
