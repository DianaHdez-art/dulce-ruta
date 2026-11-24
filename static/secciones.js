// ============================================================
// secciones.js
// Las secciones sencillas del menú: Tu cocina, Tu perfil y Más.
// ============================================================

// ---------- Tu cocina: galería de fotos ----------
async function vistaCocina() {
  const fotos = await api("/api/cocina");

  const galeria = fotos.map(f => `
    <figure>
      <img src="/uploads/${esc(f.foto)}" alt="${esc(f.titulo)}" loading="lazy">
      <figcaption>${f.emoji} ${esc(f.titulo)}<small>${f.completada_en}</small></figcaption>
    </figure>`).join("");

  const contenido = fotos.length
    ? `<div class="grid fotos">${galeria}</div>`
    : '<p class="mut">Aquí aparecerán las fotos de tus postres. Termina una lección de Mi ruta y toma tu primera foto.</p>';

  $("#main").innerHTML = `<h1>Tu cocina</h1>${contenido}`;
}

// ---------- Tu perfil: datos editables ----------
function vistaPerfil() {
  const prefs = usuario.preferencias;
  const nombresDe = lista => lista.length ? lista.map(id => NOMBRES[id]).join(", ") : "ninguno";
  const tiempo = prefs.tiempo === 120 ? "sin prisa" : "hasta " + prefs.tiempo + " min";

  $("#main").innerHTML = `
    <h1>Tu perfil</h1>
    <div class="perfil">
      <div class="ava">${esc(usuario.nombre[0].toUpperCase())}</div>
      <div><b>${esc(usuario.nombre)}</b><p class="mut">${esc(usuario.email)}</p></div>
    </div>
    <div class="stats">
      <div><b>⭐ ${usuario.xp}</b><span>XP</span></div>
      <div><b>🍰 ${usuario.completadas}</b><span>Postres hechos</span></div>
    </div>

    <label for="nombrePerfil">Nombre</label>
    <input id="nombrePerfil" maxlength="60" value="${esc(usuario.nombre)}">
    <label for="bioPerfil">Sobre mí</label>
    <textarea id="bioPerfil" rows="3" maxlength="240">${esc(usuario.bio)}</textarea>
    <button class="btn" id="guardar">Guardar cambios</button>

    <h2>Tu cocina y tus gustos</h2>
    <ul class="ing">
      <li>Alergias: ${nombresDe(prefs.alergias)}</li>
      <li>Utensilios: ${nombresDe(prefs.utensilios)}</li>
      <li>Nivel: ${NIVELES[prefs.nivel]}</li>
      <li>Tiempo por receta: ${tiempo}</li>
    </ul>
    <button class="btn sec" id="cambiarRespuestas">Cambiar mis respuestas</button>
    <button class="btn sec" id="salir">Cerrar sesión</button>`;

  $("#guardar").onclick = async () => {
    try {
      const datos = { nombre: $("#nombrePerfil").value, bio: $("#bioPerfil").value };
      await api("/api/perfil", { method: "PUT", body: datos });
      usuario = await api("/api/yo");
      vistaPerfil();
      avisar("Perfil guardado");
    } catch (error) {
      avisar(error.message);
    }
  };

  $("#cambiarRespuestas").onclick = () => {
    preguntasIniciales(prefs, async nuevas => {
      await api("/api/preferencias", { method: "PUT", body: nuevas });
      usuario = await api("/api/yo");
      vistaPerfil();
      avisar("Listo: tu ruta se ajustó a tus respuestas");
    }, true);
  };

  $("#salir").onclick = async () => {
    await api("/api/logout", { method: "POST" });
    pantallaAcceso();
  };
}

// ---------- Más: acerca de la página ----------
function vistaMas() {
  $("#main").innerHTML = `
    <h1>Más</h1>
    <h2>Sobre Dulce Ruta</h2>
    <p>Dulce Ruta enseña a preparar postres en lecciones cortas. Al empezar te preguntamos por tus alergias, tus utensilios, tu nivel y tu tiempo, y con eso armamos una ruta que va de lo más fácil a lo más complejo y todo esto comenzo por estar un fin de semana sin nada que hacer aparte de hacer MUCHAS tareas, se me antojo algo dulce y de ahi surgio la idea.</p>
    <h2>Cómo funciona</h2>
    <ul class="ing">
      <li>Cada lección es una receta: ingredientes, pasos y una foto final.</li>
      <li>Cada postre terminado suma 10 XP y desbloquea el siguiente.</li>
      <li>Las recetas con ingredientes que te dan alergia nunca aparecen en tu ruta.</li>
      <li>Guarda tus preferidas con ❤️ y explora todo el recetario por etiquetas en Más recetas.</li>
    </ul>
    <h2>Aviso</h2>
    <p class="mut">Revisa siempre las etiquetas de los ingredientes que compres: pueden contener trazas de alérgenos que esta página no puede verificar.</p>`;
}
