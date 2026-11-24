# 🧁 Dulce Ruta

Página web tipo Duolingo para aprender a hacer postres. Al entrar, la página pregunta por tus **alergias**, los **utensilios** con los que cuentas, tu **nivel** y tu **tiempo disponible**, y con eso arma una **ruta de recetas** que va de la más fácil a la más compleja.

## Qué puedes hacer

- **Mi ruta:** camino de recetas por niveles. Cada receta terminada desbloquea la siguiente y suma 10 XP.
- **Pantalla de receta:** imagen, ingredientes con casillas para marcar y pasos detallados. Al final se sube la foto del postre.
- **Tu cocina:** galería con las fotos de los postres que has terminado.
- **Favoritos:** recetas marcadas con ❤️.
- **Más recetas:** catálogo completo con filtro por etiquetas y aviso cuando una receta contiene algo que te da alergia.
- **Tu perfil:** datos editables y opción de volver a contestar las preguntas iniciales.
- **Más:** información sobre la página.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Interfaz | HTML, CSS y JavaScript |
| Servidor | Python con Flask |
| Base de datos | MySQL |

## Estructura del proyecto

```
dulce-ruta/
├── app.py              # Servidor y API (Flask)
├── schema.sql          # Tablas y recetas base de MySQL
├── requirements.txt    # Librerías de Python
└── static/
    ├── index.html      # Página principal
    ├── receta.html     # Pantalla de una receta
    ├── style.css       # Estilos
    ├── utilidades.js   # Herramientas compartidas
    ├── acceso.js       # Inicio de sesión y preguntas iniciales
    ├── ruta.js        # Mi ruta
    ├── recetas.js      # Tarjetas, favoritos y etiquetas
    ├── secciones.js    # Tu cocina, Tu perfil y Más
    ├── receta.js       # Pantalla de receta
    ├── main.js         # Menú y arranque
    └── img/           # Imágenes de las recetas
```

Las fotos que suben las personas se guardan en una carpeta `uploads/` que el servidor crea solo.

## Cómo ponerla a funcionar

**Necesitas:** Python 3.9 o superior, MySQL 8 y, para ejecutar el script de la base de datos, MySQL Workbench.

1. **Descarga el proyecto** y abre su carpeta en una terminal.
2. **Instala las librerías:**
   ```
   pip install -r requirements.txt
   ```
3. **Crea la base de datos:** abre `schema.sql` en MySQL Workbench y ejecútalo con el rayo ⚡. Crea la base `dulce_ruta` con sus tablas y las recetas base.
4. **Configura la conexión** (solo si tu MySQL no usa `root` sin contraseña). En PowerShell:
   ```
   $env:DB_PASS="tu_contraseña"
   ```
5. **Enciende la página:**
   ```
   python app.py
   ```
6. **Ábrela** en el navegador: <http://127.0.0.1:5000>

### Variables de entorno

| Variable | Para qué sirve | Valor por defecto |
| --- | --- | --- |
| `DB_HOST` | Dirección de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASS` | Contraseña de MySQL | vacía |
| `DB_NAME` | Nombre de la base | `dulce_ruta` |
| `SECRET_KEY` | Clave de las sesiones | `cambia-esta-clave` |

Antes de publicar la página en internet, cambia `SECRET_KEY` por una clave propia.

## Cómo se arma la ruta

La ruta se calcula en el servidor (función `calcular_ruta()` de `app.py`) con reglas:

1. Se descartan las recetas con algún alérgeno de la persona y las que necesitan un utensilio que no tiene.
2. Se filtran por el tiempo elegido. "Sin prisa" no pone límite.
3. Se filtran por nivel: primerizo empieza en el nivel 1, "ya he hecho postres" en el 2 y "me defiendo bien" en el 3.
4. Se ordenan por dificultad y, dentro de cada nivel, por minutos de preparación.
5. Cada receta queda como completada, actual o bloqueada.

Si el tiempo o el nivel dejan menos de tres recetas, esos filtros se relajan. Los filtros de alérgenos y utensilios nunca se relajan.

## Agregar recetas e imágenes

- **Recetas:** se agregan con un `INSERT` en la tabla `recetas`. La columna `dificultad` define el nivel en la ruta; no hay un máximo.
- **Imágenes:** guarda la imagen en `static/img/` con el nombre de la receta en minúsculas, sin acentos y con guiones, terminada en `.jpg`. Por ejemplo, `flan-napolitano.jpg` para "Flan napolitano". No hace falta tocar la base de datos.



## Limitaciones

- Las alergias se basan en los alérgenos declarados en cada receta; no detectan trazas en los ingredientes que compres.
- Las fotos se guardan en una carpeta local del servidor, no en la nube.
- La ruta usa reglas fijas: no aprende del desempeño de la persona.
- Con pocos utensilios y varias alergias la ruta puede quedar muy corta; falta ampliar el catálogo de recetas.

## Autores

[Nombre del equipo e integrantes]

Proyecto académico.
