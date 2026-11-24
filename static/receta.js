// ============================================================
// receta.js
// Pantalla completa de UNA receta: foto, ingredientes, pasos
// y, si le toca, el botón para terminarla con la foto del postre.
// Usa utilidades.js ($, esc, api, avisar, NOMBRES).
// ============================================================

// El número de receta es lo último de la dirección:  /receta/9  ->  "9"
const ID = location.pathname.split("/").pop();

async function cargarReceta() {
  try {
    const receta = await api("/api/receta/" + ID);
    document.title = receta.titulo + " · Dulce Ruta";
    dibujarReceta(receta);
  } catch (error) {
    if (error.status === 401) { location.href = "/"; return; } // sin sesión: a la pantalla de entrada
    $("#receta").innerHTML = `<p class="err">${esc(error.message)}</p><a class="btn" href="/">Volver a Mi ruta</a>`;
  }
}

// Imagen grande de la receta: tu foto (o el dibujo) de static/img; si no hay, el emoji
function imagenGrande(receta) {
  if (!receta.imagen) return `<div class="hero hero-emoji">${receta.emoji}</div>`;
  return `<img class="hero" src="/static/img/${esc(receta.imagen)}" alt="${esc(receta.titulo)}">`;
}

// Parte de abajo: depende de si la receta ya se puede completar
function bloqueFinal(receta) {
  if (receta.estado === "actual" || receta.estado === "completada") {
    const ya = receta.estado === "completada";
    return `
      <section class="final" id="final">
        <h2>${ya ? "Ya la completaste 🎉" : "¿Ya terminaste tu postre?"}</h2>
        <p class="ayuda">Toma una foto de tu postre y se guardará en Tu cocina.</p>
        <input type="file" id="foto" accept="image/*" capture="environment">
        <img id="prev" class="prev hidden" alt="Vista previa">
        <button class="btn" id="terminar">${ya ? "Guardar otra foto" : "¡Terminé mi postre!"}</button>
      </section>`;
  }
  if (receta.estado === "bloqueada") {
    return '<p class="aviso">🔒 Esta receta se desbloquea al completar las anteriores en Mi ruta. Mientras tanto puedes leerla.</p>';
  }
  return '<p class="aviso">Esta receta no forma parte de tu ruta (por tus alergias, utensilios, tiempo o nivel), pero puedes leerla.</p>';
}

function dibujarReceta(receta) {
  const alerta = receta.alerta.length
    ? `<p class="warn">⚠️ Contiene: ${receta.alerta.map(a => NOMBRES[a]).join(", ")}</p>` : "";

  const ingredientes = receta.ingredientes.map(texto =>
    `<li><label><input type="checkbox"><span>${esc(texto)}</span></label></li>`).join("");

  const pasos = receta.pasos.map((texto, n) =>
    `<li class="paso"><span class="num">${n + 1}</span><p>${esc(texto)}</p></li>`).join("");

  $("#receta").innerHTML = `
    <a class="volver" href="/">← Volver a Mi ruta</a>
    ${imagenGrande(receta)}
    <h1>${esc(receta.titulo)}</h1>
    <p class="mut">${esc(receta.descripcion)}</p>
    <div class="meta">
      <span class="dato">Nivel ${receta.dificultad}</span>
      <span class="dato">⏱ ${receta.minutos} min</span>
      ${receta.etiquetas.map(t => `<span class="dato">${esc(t)}</span>`).join("")}
    </div>
    ${alerta}

    <h2>Ingredientes</h2>
    <p class="ayuda">Marca cada ingrediente cuando lo tengas listo.</p>
    <ul class="lista-ing">${ingredientes}</ul>

    <h2>Preparación</h2>
    <p class="ayuda">Toca cada paso cuando lo termines.</p>
    <ol class="pasos">${pasos}</ol>

    ${bloqueFinal(receta)}`;

  // Tocar un paso lo marca como hecho
  document.querySelectorAll(".paso").forEach(paso => {
    paso.onclick = () => paso.classList.toggle("hecho");
  });

  if ($("#terminar")) {
    $("#foto").onchange = evento => {
      const archivo = evento.target.files[0];
      if (archivo) {
        $("#prev").src = URL.createObjectURL(archivo);
        $("#prev").classList.remove("hidden");
      }
    };
    $("#terminar").onclick = terminarReceta;
  }
}

// Avisa al servidor que la receta se completó (con la foto, si hay)
async function terminarReceta() {
  const formulario = new FormData();
  const foto = $("#foto").files[0];
  if (foto) formulario.append("foto", foto);

  try {
    const respuesta = await api(`/api/leccion/${ID}/completar`, { method: "POST", body: formulario });
    $("#final").innerHTML = `
      <h2>¡Postre completado! 🎉</h2>
      <p class="ayuda">${respuesta.xp ? "Ganaste +10 XP." : "Foto guardada en Tu cocina."}</p>
      <a class="btn" href="/">Volver a Mi ruta</a>`;
  } catch (error) {
    avisar(error.message);
  }
}

cargarReceta();
