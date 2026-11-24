// ============================================================
// utilidades.js
// Herramientas y datos que usan todas las demás partes.
// ============================================================

// Atajo para buscar un elemento de la página:  $("#main")
const $ = selector => document.querySelector(selector);

// Vuelve "seguro" un texto antes de pegarlo en el HTML,
// para que nadie pueda meter código escribiéndolo en su nombre.
function esc(texto) {
  const reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texto ?? "").replace(/[&<>"']/g, letra => reemplazos[letra]);
}

// ---------- Datos fijos ----------
// Cada opción es [id, texto con emoji]. Los ids son los mismos que usa la base de datos.
const ALERGIAS = [
  ["gluten", "🌾 Gluten"],
  ["lacteos", "🥛 Lácteos"],
  ["huevo", "🥚 Huevo"],
  ["frutos_secos", "🌰 Frutos secos"],
  ["soya", "🫘 Soya"],
];
const UTENSILIOS = [
  ["horno", "🔥 Horno"],
  ["estufa", "🍳 Estufa"],
  ["batidora", "🌀 Batidora"],
  ["licuadora", "🥤 Licuadora"],
  ["microondas", "📡 Microondas"],
  ["refrigerador", "🧊 Refrigerador"],
  ["sarten", "🥘 Sartén"],
];
const NIVELES = {
  principiante: "Primerizo",
  intermedio: "Ya he hecho postres",
  avanzado: "Me defiendo bien",
};

// Diccionario id -> nombre sin emoji.  Ejemplo: NOMBRES["lacteos"] da "Lácteos"
const NOMBRES = Object.fromEntries(
  [...ALERGIAS, ...UTENSILIOS].map(([id, texto]) => [id, texto.replace(/^\S+\s/, "")])
);

// ---------- Lo que la página "recuerda" mientras está abierta ----------
let usuario = null;          // datos de quien inició sesión
let recetas = [];            // lista de recetas (para Favoritos y Más recetas)
let seccionActual = "ruta";  // qué sección del menú se está viendo
let etiquetaElegida = "";    // filtro elegido en Más recetas ("" = todas)

// ---------- Hablar con el servidor (app.py) ----------
async function api(url, opciones = {}) {
  // Si mandamos datos normales, los convertimos a texto JSON
  const mandaJson = opciones.body && !(opciones.body instanceof FormData);
  if (mandaJson) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(opciones.body);
  }
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json().catch(() => ({}));

  // Si el servidor dijo "error", lo convertimos en un error que podamos atrapar con try/catch
  if (!respuesta.ok) {
    const error = new Error(datos.error || "Algo salió mal. Intenta de nuevo.");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

// ---------- Ventana emergente (modal) y avisos ----------
function modal(html, conBotonCerrar = true) {
  const fondo = $("#modal");
  const botonX = conBotonCerrar ? '<button class="x" aria-label="Cerrar" onclick="cerrar()">✕</button>' : "";
  fondo.innerHTML = `<div class="box">${botonX}${html}</div>`;
  fondo.classList.remove("hidden");
  // Tocar el fondo oscuro también cierra la ventana
  fondo.onclick = evento => {
    if (conBotonCerrar && evento.target === fondo) cerrar();
  };
}

function cerrar() {
  $("#modal").classList.add("hidden");
  $("#modal").innerHTML = "";
}

// Mensajito que aparece abajo unos segundos
function avisar(texto) {
  const aviso = $("#toast");
  aviso.textContent = texto;
  aviso.classList.remove("hidden");
  setTimeout(() => aviso.classList.add("hidden"), 2600);
}
