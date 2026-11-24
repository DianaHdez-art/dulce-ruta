// ============================================================
// recetas.js
// Tarjetas de recetas, favoritos (❤️) y "Más recetas" con etiquetas.
// ============================================================

// Foto de referencia de la receta (carpeta static/img). Si no tiene foto, se muestra el emoji.
function imagenReceta(receta) {
  if (!receta.imagen) return `<div class="emo">${receta.emoji}</div>`;
  return `<img class="ref" src="/static/img/${esc(receta.imagen)}" alt="${esc(receta.titulo)}" loading="lazy" onerror="this.remove()">`;
}

// Aviso rojo si la receta tiene algo que le da alergia a la persona
function avisoAlergias(receta) {
  if (!receta.alerta.length) return "";
  return `<p class="warn">⚠️ Contiene: ${receta.alerta.map(a => NOMBRES[a]).join(", ")}</p>`;
}

// Dibuja una cuadrícula de tarjetas con las recetas de "lista"
function tarjetas(lista, mensajeVacio) {
  if (!lista.length) return `<p class="mut">${mensajeVacio}</p>`;

  const cada = lista.map(receta => `
    <article class="card" data-abrir="${receta.id}">
      <button class="fav" data-favorito="${receta.id}" aria-label="Favorito">${receta.fav ? "❤️" : "🤍"}</button>
      ${imagenReceta(receta)}
      <h3>${esc(receta.titulo)}</h3>
      <p class="mut">Nivel ${receta.dificultad} · ${receta.minutos} min</p>
      <div class="tags">${receta.etiquetas.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      ${avisoAlergias(receta)}
    </article>`).join("");

  return `<div class="grid">${cada}</div>`;
}

// Un solo "oyente" para todos los clics de las tarjetas:
// el corazón, una etiqueta del filtro, o la tarjeta completa.
document.addEventListener("click", async evento => {
  const corazon = evento.target.closest("[data-favorito]");
  if (corazon) {
    evento.stopPropagation();
    const respuesta = await api("/api/favoritos/" + corazon.dataset.favorito, { method: "POST" });
    recetas.find(r => r.id == corazon.dataset.favorito).fav = respuesta.fav;
    return VISTAS[seccionActual](); // volvemos a dibujar la sección actual
  }

  const etiqueta = evento.target.closest("[data-etiqueta]");
  if (etiqueta) {
    etiquetaElegida = etiqueta.dataset.etiqueta;
    return vistaRecetas();
  }

  const tarjeta = evento.target.closest("[data-abrir]");
  if (tarjeta) window.open("/receta/" + tarjeta.dataset.abrir, "_blank"); // pantalla completa de la receta
});

function vistaFavoritos() {
  const favoritas = recetas.filter(r => r.fav);
  $("#main").innerHTML = `
    <h1>Favoritos</h1>
    ${tarjetas(favoritas, "Aún no tienes favoritos. Toca el 🤍 en cualquier receta de Más recetas.")}`;
}

function vistaRecetas() {
  // Lista de todas las etiquetas distintas, sin repetir y en orden alfabético
  const etiquetas = [...new Set(recetas.flatMap(r => r.etiquetas))].sort();
  const mostradas = etiquetaElegida ? recetas.filter(r => r.etiquetas.includes(etiquetaElegida)) : recetas;

  const botones = etiquetas.map(e => `
    <button class="chip ${e === etiquetaElegida ? "on" : ""}" data-etiqueta="${esc(e)}">${esc(e)}</button>`).join("");

  $("#main").innerHTML = `
    <h1>Más recetas</h1>
    <div class="chips">
      <button class="chip ${etiquetaElegida ? "" : "on"}" data-etiqueta="">Todas</button>
      ${botones}
    </div>
    ${tarjetas(mostradas, "No hay recetas con esa etiqueta.")}`;
}
