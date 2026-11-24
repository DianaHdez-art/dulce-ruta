import os, json, uuid, re, unicodedata
from functools import wraps
from flask import Flask, request, session, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import mysql.connector

BASE = os.path.dirname(os.path.abspath(__file__))
UPLOADS = os.path.join(BASE, "uploads")
os.makedirs(UPLOADS, exist_ok=True)

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.secret_key = os.getenv("SECRET_KEY", "cambia-esta-clave")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

ALERGIAS = {"gluten", "lacteos", "huevo", "frutos_secos", "soya"}
UTENSILIOS = {"horno", "estufa", "batidora", "licuadora", "microondas", "refrigerador", "sarten"}
NIVEL_MIN = {"principiante": 1, "intermedio": 2, "avanzado": 3}


def q(sql, args=(), one=False, commit=False):
    con = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password="Diana23HM",
        database=os.getenv("DB_NAME", "dulce_ruta")
    )
    cur = con.cursor(dictionary=True)
    try:
        cur.execute(sql, args)
        if commit:
            con.commit()
            return cur.lastrowid
        return cur.fetchone() if one else cur.fetchall()
    finally:
        cur.close()
        con.close()


def login_required(f):
    @wraps(f)
    def w(*a, **k):
        if "uid" not in session:
            return jsonify(error="Inicia sesión para continuar."), 401
        return f(*a, **k)
    return w


IMG_DIR = os.path.join(BASE, "static", "img")


def slug(titulo):
    """'Crème brûlée' -> 'creme-brulee' (nombre de archivo de la imagen)."""
    s = unicodedata.normalize("NFKD", titulo).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def imagen_de(r):
    """Usa la columna imagen si tiene algo; si no, busca static/img/<slug>.jpg|png|webp."""
    if r.get("imagen"):
        return r["imagen"]
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".svg"):  # una foto gana sobre el dibujo .svg
        nombre = slug(r["titulo"]) + ext
        if os.path.isfile(os.path.join(IMG_DIR, nombre)):
            return nombre
    return None


def rec(r):
    for k in ("utensilios", "alergenos", "etiquetas", "ingredientes", "pasos"):
        r[k] = json.loads(r[k])
    r["imagen"] = imagen_de(r)
    return r


def prefs(uid):
    p = q("SELECT * FROM preferencias WHERE usuario_id=%s", (uid,), one=True)
    if p:
        p["alergias"] = json.loads(p["alergias"])
        p["utensilios"] = json.loads(p["utensilios"])
        del p["usuario_id"]
    return p


# ---------- páginas ----------
@app.get("/")
def index():
    return send_from_directory("static", "index.html")


@app.get("/receta/<int:rid>")
def pagina_receta(rid):
    return send_from_directory("static", "receta.html")


@app.get("/uploads/<path:nombre>")
def uploads(nombre):
    return send_from_directory(UPLOADS, nombre)


# ---------- cuenta ----------
@app.post("/api/registro")
def registro():
    d = request.get_json(force=True)
    nombre = (d.get("nombre") or "").strip()[:60]
    email = (d.get("email") or "").strip().lower()
    pw = d.get("password") or ""
    if not nombre or "@" not in email or len(pw) < 6:
        return jsonify(error="Escribe tu nombre, un correo válido y una contraseña de 6 caracteres o más."), 400
    if q("SELECT 1 FROM usuarios WHERE email=%s", (email,), one=True):
        return jsonify(error="Ese correo ya tiene cuenta. Inicia sesión."), 409
    session["uid"] = q("INSERT INTO usuarios (nombre,email,password_hash) VALUES (%s,%s,%s)",
                       (nombre, email, generate_password_hash(pw)), commit=True)
    return jsonify(ok=True)


@app.post("/api/login")
def login():
    d = request.get_json(force=True)
    u = q("SELECT id,password_hash FROM usuarios WHERE email=%s", ((d.get("email") or "").strip().lower(),), one=True)
    if not u or not check_password_hash(u["password_hash"], d.get("password") or ""):
        return jsonify(error="Correo o contraseña incorrectos."), 401
    session["uid"] = u["id"]
    return jsonify(ok=True)


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@app.get("/api/yo")
@login_required
def yo():
    uid = session["uid"]
    u = q("SELECT id,nombre,email,bio,xp FROM usuarios WHERE id=%s", (uid,), one=True)
    if not u:
        session.clear()
        return jsonify(error="Sesión inválida."), 401
    u["preferencias"] = prefs(uid)
    u["completadas"] = q("SELECT COUNT(*) n FROM progreso WHERE usuario_id=%s", (uid,), one=True)["n"]
    return jsonify(u)


@app.put("/api/perfil")
@login_required
def perfil():
    d = request.get_json(force=True)
    nombre = (d.get("nombre") or "").strip()[:60]
    if not nombre:
        return jsonify(error="El nombre no puede estar vacío."), 400
    q("UPDATE usuarios SET nombre=%s, bio=%s WHERE id=%s",
      (nombre, (d.get("bio") or "").strip()[:240], session["uid"]), commit=True)
    return jsonify(ok=True)


@app.put("/api/preferencias")
@login_required
def preferencias():
    d = request.get_json(force=True)
    al = sorted(set(d.get("alergias", [])) & ALERGIAS)
    ut = sorted(set(d.get("utensilios", [])) & UTENSILIOS)
    nivel = d.get("nivel") if d.get("nivel") in NIVEL_MIN else "principiante"
    tiempo = d.get("tiempo") if d.get("tiempo") in (30, 60, 120) else 60
    q("""INSERT INTO preferencias (usuario_id,alergias,utensilios,nivel,tiempo) VALUES (%s,%s,%s,%s,%s)
         ON DUPLICATE KEY UPDATE alergias=VALUES(alergias), utensilios=VALUES(utensilios),
         nivel=VALUES(nivel), tiempo=VALUES(tiempo)""",
      (session["uid"], json.dumps(al), json.dumps(ut), nivel, tiempo), commit=True)
    return jsonify(ok=True)


# ---------- ruta de aprendizaje ----------
def calcular_ruta(uid):
    """Ruta personalizada: lista de recetas con su estado (completada / actual / bloqueada).
    Devuelve None si la persona todavía no contesta las preguntas iniciales."""
    p = prefs(uid)
    if not p:
        return None
    alergias = set(p["alergias"])
    tengo = set(p["utensilios"])
    hechas = {r["receta_id"] for r in q("SELECT receta_id FROM progreso WHERE usuario_id=%s", (uid,))}

    # 1) seguras: sin alérgenos del usuario y con utensilios que tiene
    seguras = []
    for r in q("SELECT * FROM recetas ORDER BY dificultad, minutos"):
        r = rec(r)
        if alergias & set(r["alergenos"]) or not set(r["utensilios"]) <= tengo:
            continue
        seguras.append(r)

    # 2) ajustar a su tiempo y nivel; si queda muy corta la ruta, se relaja el filtro
    lista = [r for r in seguras if p["tiempo"] >= 120 or r["minutos"] <= p["tiempo"]]
    if len(lista) < 3:
        lista = seguras
    nivel = [r for r in lista if r["dificultad"] >= NIVEL_MIN[p["nivel"]]]
    if len(nivel) >= 3:
        lista = nivel

    # 3) estados: completada / actual / bloqueada (se desbloquean en orden)
    actual_listo = False
    for r in lista:
        if r["id"] in hechas:
            r["estado"] = "completada"
        elif not actual_listo:
            r["estado"], actual_listo = "actual", True
        else:
            r["estado"] = "bloqueada"
    return lista


@app.get("/api/ruta")
@login_required
def ruta():
    lista = calcular_ruta(session["uid"])
    if lista is None:
        return jsonify(error="Responde primero las preguntas iniciales."), 409
    return jsonify(lista)


@app.get("/api/receta/<int:rid>")
@login_required
def receta(rid):
    """Una receta completa para su pantalla propia, con su estado dentro de la ruta de la persona."""
    uid = session["uid"]
    r = q("SELECT * FROM recetas WHERE id=%s", (rid,), one=True)
    if not r:
        return jsonify(error="Receta no encontrada."), 404
    r = rec(r)
    p = prefs(uid)
    r["alerta"] = sorted(set(p["alergias"]) & set(r["alergenos"])) if p else []
    # "fuera" = la receta no está en su ruta (por alergias, utensilios, tiempo o nivel)
    r["estado"] = next((x["estado"] for x in (calcular_ruta(uid) or []) if x["id"] == rid), "fuera")
    return jsonify(r)


@app.post("/api/leccion/<int:rid>/completar")
@login_required
def completar(rid):
    uid = session["uid"]
    if not q("SELECT 1 FROM recetas WHERE id=%s", (rid,), one=True):
        return jsonify(error="Receta no encontrada."), 404
    estado = next((x["estado"] for x in (calcular_ruta(uid) or []) if x["id"] == rid), None)
    if estado not in ("actual", "completada"):
        return jsonify(error="Esa receta todavía está bloqueada: completa antes las anteriores."), 403
    foto = None
    f = request.files.get("foto")
    if f and f.filename:
        ext = os.path.splitext(secure_filename(f.filename))[1].lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".heic"}:
            return jsonify(error="La foto debe ser JPG, PNG o WEBP."), 400
        foto = uuid.uuid4().hex + ext
        f.save(os.path.join(UPLOADS, foto))
    nuevo = not q("SELECT 1 FROM progreso WHERE usuario_id=%s AND receta_id=%s", (uid, rid), one=True)
    q("""INSERT INTO progreso (usuario_id,receta_id,foto) VALUES (%s,%s,%s)
         ON DUPLICATE KEY UPDATE foto=COALESCE(VALUES(foto), foto)""", (uid, rid, foto), commit=True)
    if nuevo:
        q("UPDATE usuarios SET xp=xp+10 WHERE id=%s", (uid,), commit=True)
    return jsonify(ok=True, xp=nuevo)


# ---------- cocina, recetas y favoritos ----------
@app.get("/api/cocina")
@login_required
def cocina():
    rows = q("""SELECT p.foto, p.completada_en, r.titulo, r.emoji FROM progreso p
                JOIN recetas r ON r.id=p.receta_id
                WHERE p.usuario_id=%s AND p.foto IS NOT NULL ORDER BY p.completada_en DESC""", (session["uid"],))
    for r in rows:
        r["completada_en"] = r["completada_en"].strftime("%d/%m/%Y")
    return jsonify(rows)


@app.get("/api/recetas")
@login_required
def recetas():
    uid = session["uid"]
    p = prefs(uid)
    al = set(p["alergias"]) if p else set()
    favs = {r["receta_id"] for r in q("SELECT receta_id FROM favoritos WHERE usuario_id=%s", (uid,))}
    out = []
    for r in q("SELECT * FROM recetas ORDER BY dificultad, titulo"):
        r = rec(r)
        r["alerta"] = sorted(al & set(r["alergenos"]))
        r["fav"] = r["id"] in favs
        out.append(r)
    return jsonify(out)


@app.post("/api/favoritos/<int:rid>")
@login_required
def favorito(rid):
    uid = session["uid"]
    if q("SELECT 1 FROM favoritos WHERE usuario_id=%s AND receta_id=%s", (uid, rid), one=True):
        q("DELETE FROM favoritos WHERE usuario_id=%s AND receta_id=%s", (uid, rid), commit=True)
        return jsonify(fav=False)
    q("INSERT INTO favoritos (usuario_id,receta_id) VALUES (%s,%s)", (uid, rid), commit=True)
    return jsonify(fav=True)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
