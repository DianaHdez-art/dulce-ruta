// ============================================================
// ruta.js
// "Mi ruta": el camino de recetas. Al tocar una receta se abre
// su pantalla completa (receta.html) en una pestaña nueva.
// ============================================================

// Cuánto se mueve cada círculo hacia los lados para hacer el zigzag (en píxeles)
const DESPLAZAMIENTOS = [0, 45, 75, 45, 0, -45, -75, -45];

async function vistaRuta() {
  const lecciones = await api("/api/ruta");
  let nivelAnterior = 0;

  const nodos = lecciones.map((leccion, posicion) => {
    // Cuando cambia la dificultad, ponemos un título "Nivel N"
    let encabezado = "";
    if (leccion.dificultad !== nivelAnterior) {
      nivelAnterior = leccion.dificultad;
      encabezado = `<h3 class="sec-h">Nivel ${nivelAnterior}</h3>`;
    }

    let circulo;
    if (leccion.estado === "bloqueada") {
      circulo = `<button class="nodo bloqueada" disabled aria-label="${esc(leccion.titulo)} (bloqueada)">🔒</button>`;
    } else {
      // Un enlace normal. target="_blank" = pestaña nueva
      // (cámbialo por "_self" si prefieres abrirla en la misma pestaña).
      const icono = leccion.estado === "completada" ? "✓" : leccion.emoji;
      circulo = `<a class="nodo ${leccion.estado}" href="/receta/${leccion.id}" target="_blank" rel="noopener" aria-label="${esc(leccion.titulo)}">${icono}</a>`;
    }

    const desplazamiento = DESPLAZAMIENTOS[posicion % DESPLAZAMIENTOS.length];
    return `
      ${encabezado}
      <div class="nodo-w" style="margin-left:${desplazamiento}px">
        ${circulo}
        <small>${esc(leccion.titulo)}</small>
      </div>`;
  }).join("");

  const contenido = lecciones.length
    ? `<div class="camino">${nodos}</div>`
    : '<p class="mut">Con tus alergias y utensilios no hay recetas disponibles. Cambia tus respuestas en Tu perfil.</p>';

  $("#main").innerHTML = `
    <div class="top">
      <h1>Tu ruta de postres</h1>
      <span class="xp">⭐ ${usuario.xp} XP</span>
    </div>
    ${contenido}`;
}
