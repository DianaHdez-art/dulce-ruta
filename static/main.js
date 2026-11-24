// ============================================================
// main.js
// El menú lateral y el arranque de la página. Se carga al final.
// ============================================================

// Qué función dibuja cada sección del menú (el nombre es el data-v del botón en index.html)
const VISTAS = {
  ruta: vistaRuta,
  perfil: vistaPerfil,
  cocina: vistaCocina,
  favoritos: vistaFavoritos,
  recetas: vistaRecetas,
  mas: vistaMas,
};

// Cambia a otra sección del menú
async function irA(seccion) {
  seccionActual = seccion;

  // Resaltar el botón del menú que está activo
  document.querySelectorAll("#nav button").forEach(boton => {
    boton.classList.toggle("on", boton.dataset.v === seccion);
  });

  // Estas dos secciones necesitan la lista de recetas actualizada
  if (seccion === "recetas" || seccion === "favoritos") {
    recetas = await api("/api/recetas");
  }

  try {
    await VISTAS[seccion]();
  } catch (error) {
    if (error.status === 401) pantallaAcceso();
    else $("#main").innerHTML = `<p class="err">${esc(error.message)}</p>`;
  }
}

// Primer paso al abrir la página: ¿ya inició sesión?
async function iniciar() {
  try {
    usuario = await api("/api/yo");
  } catch {
    return pantallaAcceso();
  }
  $("#auth").classList.add("hidden");
  $("#app").classList.remove("hidden");

  if (!usuario.preferencias) {
    // Primera vez: hacemos las preguntas iniciales y luego arrancamos de nuevo
    preguntasIniciales(null, async respuestas => {
      await api("/api/preferencias", { method: "PUT", body: respuestas });
      iniciar();
    });
  } else {
    irA("ruta");
  }
}

// Cada botón del menú lleva a su sección
document.querySelectorAll("#nav button").forEach(boton => {
  boton.onclick = () => irA(boton.dataset.v);
});

// Al volver a esta pestaña (por ejemplo, después de terminar una receta en otra pestaña)
// se actualizan los XP y la ruta.
document.addEventListener("visibilitychange", async () => {
  if (document.hidden || !usuario || seccionActual !== "ruta") return;
  usuario = await api("/api/yo").catch(() => usuario);
  vistaRuta();
});

iniciar();
