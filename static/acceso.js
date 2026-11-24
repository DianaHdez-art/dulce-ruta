// ============================================================
// acceso.js
// 1) Pantalla de entrada (iniciar sesión / crear cuenta)
// 2) Preguntas iniciales (alergias, utensilios, nivel, tiempo)
// ============================================================

function pantallaAcceso() {
  $("#app").classList.add("hidden");
  const pantalla = $("#auth");
  pantalla.classList.remove("hidden");

  let modoRegistro = false; // false = iniciar sesión, true = crear cuenta

  function dibujar() {
    const campoNombre = modoRegistro ? '<input id="nombre" placeholder="Tu nombre" maxlength="60">' : "";
    pantalla.innerHTML = `
      <div class="authbox">
        <div class="logo">🧁</div>
        <h1>Dulce Ruta</h1>
        <p class="mut">Aprende a hacer postres, un paso a la vez.</p>
        ${campoNombre}
        <input id="correo" type="email" placeholder="Correo">
        <input id="clave" type="password" placeholder="Contraseña">
        <p id="error" class="err"></p>
        <button class="btn" id="entrar">${modoRegistro ? "Crear cuenta" : "Entrar"}</button><br>
        <button class="link" id="cambiar">${modoRegistro ? "Ya tengo cuenta" : "Soy nuevo: crear cuenta"}</button>
      </div>`;
    $("#cambiar").onclick = () => { modoRegistro = !modoRegistro; dibujar(); };
    $("#entrar").onclick = enviar;
  }

  async function enviar() {
    const direccion = modoRegistro ? "/api/registro" : "/api/login";
    const datos = { nombre: $("#nombre")?.value, email: $("#correo").value, password: $("#clave").value };
    try {
      await api(direccion, { method: "POST", body: datos });
      iniciar();
    } catch (error) {
      $("#error").textContent = error.message;
    }
  }

  dibujar();
}

// actuales: respuestas anteriores (o null si es la primera vez)
// alTerminar: función que se ejecuta con las respuestas al final
// sePuedeCancelar: true si se abrió desde Tu perfil
function preguntasIniciales(actuales, alTerminar, sePuedeCancelar) {
  // Respuestas que la persona va eligiendo
  const respuestas = {
    alergias: [...(actuales?.alergias || [])],
    utensilios: [...(actuales?.utensilios || [])],
    nivel: actuales?.nivel || "principiante",
    tiempo: actuales?.tiempo || 60,
  };

  // Las 4 preguntas. "varias: true" = se pueden elegir varias opciones
  const preguntas = [
    { titulo: "¿Tienes alguna alergia?", campo: "alergias", opciones: ALERGIAS, varias: true, ayuda: "Elige todas las que apliquen, o ninguna." },
    { titulo: "¿Con qué utensilios cuentas?", campo: "utensilios", opciones: UTENSILIOS, varias: true, ayuda: "Damos por hecho bowl, cuchara y cuchillo." },
    { titulo: "¿Cuál es tu nivel en la cocina?", campo: "nivel", opciones: Object.entries(NIVELES), varias: false, ayuda: "" },
    { titulo: "¿Cuánto tiempo tienes por receta?", campo: "tiempo", opciones: [[30, "Hasta 30 min"], [60, "Hasta 1 hora"], [120, "Sin prisa"]], varias: false, ayuda: "" },
  ];
  let numero = 0; // pregunta en la que vamos

  function estaElegida(pregunta, valor) {
    const elegido = respuestas[pregunta.campo];
    return pregunta.varias ? elegido.includes(valor) : elegido == valor;
  }

  function elegir(pregunta, valor) {
    if (pregunta.varias) {
      // Si ya estaba elegida la quitamos; si no, la agregamos
      const lista = respuestas[pregunta.campo];
      respuestas[pregunta.campo] = lista.includes(valor) ? lista.filter(v => v != valor) : [...lista, valor];
    } else {
      respuestas[pregunta.campo] = valor;
    }
  }

  function dibujar() {
    const pregunta = preguntas[numero];
    const esLaUltima = numero === preguntas.length - 1;
    const progreso = numero / preguntas.length * 100;

    const botonesOpciones = pregunta.opciones.map(([valor, texto]) => `
      <button class="chip ${estaElegida(pregunta, valor) ? "on" : ""}" data-valor="${valor}">${texto}</button>`
    ).join("");

    let botonIzquierdo = "";
    if (numero > 0) botonIzquierdo = '<button class="btn sec" id="atras">Atrás</button>';
    else if (sePuedeCancelar) botonIzquierdo = '<button class="btn sec" id="cancelar">Cancelar</button>';

    modal(`
      <div class="bar"><i style="width:${progreso}%"></i></div>
      <h2>${pregunta.titulo}</h2>
      <p class="mut">${pregunta.ayuda}</p>
      <div class="chips">${botonesOpciones}</div>
      <div class="acc">
        ${botonIzquierdo}
        <button class="btn" id="siguiente">${esLaUltima ? "Crear mi ruta" : "Continuar"}</button>
      </div>`, false);

    // Al tocar una opción: la marcamos y volvemos a dibujar
    document.querySelectorAll(".chip").forEach(boton => {
      boton.onclick = () => {
        const valor = pregunta.campo === "tiempo" ? Number(boton.dataset.valor) : boton.dataset.valor;
        elegir(pregunta, valor);
        dibujar();
      };
    });
    if (numero > 0) $("#atras").onclick = () => { numero--; dibujar(); };
    if (numero === 0 && sePuedeCancelar) $("#cancelar").onclick = cerrar;
    $("#siguiente").onclick = () => {
      if (!esLaUltima) { numero++; dibujar(); }
      else { cerrar(); alTerminar(respuestas); }
    };
  }

  dibujar();
}
