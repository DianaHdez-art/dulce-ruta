CREATE DATABASE IF NOT EXISTS dulce_ruta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dulce_ruta;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(240) NOT NULL DEFAULT '',
  xp INT NOT NULL DEFAULT 0,
  creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preferencias (
  usuario_id INT PRIMARY KEY,
  alergias JSON NOT NULL,
  utensilios JSON NOT NULL,
  nivel ENUM('principiante','intermedio','avanzado') NOT NULL DEFAULT 'principiante',
  tiempo INT NOT NULL DEFAULT 60,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE recetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(80) NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  emoji VARCHAR(8) NOT NULL,
  dificultad TINYINT NOT NULL,           -- 1 (fácil) a 5 (compleja)
  minutos INT NOT NULL,
  utensilios JSON NOT NULL,              -- lo que necesita además de bowl, cuchara y cuchillo
  alergenos JSON NOT NULL,               -- gluten, lacteos, huevo, frutos_secos, soya
  etiquetas JSON NOT NULL,
  ingredientes JSON NOT NULL,
  pasos JSON NOT NULL
);

CREATE TABLE progreso (
  usuario_id INT NOT NULL,
  receta_id INT NOT NULL,
  foto VARCHAR(80) NULL,
  completada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, receta_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

CREATE TABLE favoritos (
  usuario_id INT NOT NULL,
  receta_id INT NOT NULL,
  PRIMARY KEY (usuario_id, receta_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

INSERT INTO recetas (titulo, descripcion, emoji, dificultad, minutos, utensilios, alergenos, etiquetas, ingredientes, pasos) VALUES
('Paletas de fresa','Paletas heladas con tres ingredientes.','🍓',1,15,'["licuadora","refrigerador"]','[]','["sin horno","vegano","frutal"]',
 '["2 tazas de fresas","1/2 taza de agua","3 cucharadas de azúcar"]',
 '["Lava las fresas y quítales el rabito.","Licúa las fresas con el agua y el azúcar.","Vierte la mezcla en moldes para paleta.","Congela al menos 4 horas."]'),
('Plátano con chocolate','Plátanos congelados bañados en chocolate.','🍌',1,20,'["microondas","refrigerador"]','[]','["sin horno","vegano","rápido"]',
 '["2 plátanos","100 g de chocolate semiamargo sin leche","Palitos de madera"]',
 '["Pela los plátanos, córtalos a la mitad y clava un palito en cada uno.","Derrite el chocolate en el microondas, 30 segundos a la vez, moviendo entre cada vuelta.","Baña los plátanos con el chocolate.","Congela 1 hora."]'),
('Gelatina de frutas','Gelatina fresca con trozos de fruta.','🍇',1,25,'["estufa","refrigerador"]','[]','["sin horno","frutal","fácil"]',
 '["1 sobre de grenetina sin sabor","2 tazas de jugo de naranja","1 taza de fruta picada","2 cucharadas de azúcar"]',
 '["Hidrata la grenetina en 1/2 taza de jugo frío por 5 minutos.","Calienta el resto del jugo con el azúcar, sin que hierva, y mezcla con la grenetina.","Pon la fruta en un molde y vierte el líquido.","Refrigera 3 horas."]'),
('Arroz con leche','Clásico cremoso con canela.','🍚',2,45,'["estufa"]','["lacteos"]','["clásico","canela"]',
 '["1 taza de arroz","4 tazas de leche","1 raja de canela","1/2 taza de azúcar"]',
 '["Hierve el arroz en 2 tazas de agua con la canela hasta que seque.","Agrega la leche y cocina a fuego bajo, moviendo seguido.","Añade el azúcar cuando espese.","Sirve tibio o frío."]'),
('Mousse de chocolate','Mousse aireado de cuatro ingredientes.','🍫',2,30,'["batidora","refrigerador","microondas"]','["lacteos","huevo"]','["sin horno","chocolate"]',
 '["150 g de chocolate semiamargo","3 huevos","1 taza de crema para batir","2 cucharadas de azúcar"]',
 '["Derrite el chocolate en el microondas y deja entibiar.","Bate la crema a picos suaves.","Bate las claras con el azúcar hasta que formen picos y mezcla las yemas con el chocolate.","Incorpora crema y claras con movimientos envolventes y refrigera 3 horas."]'),
('Galletas de avena','Crujientes por fuera, suaves por dentro.','🍪',2,35,'["horno"]','["gluten","huevo","lacteos"]','["horneado","clásico"]',
 '["1 taza de avena","1 taza de harina","1/2 taza de mantequilla","1/2 taza de azúcar morena","1 huevo"]',
 '["Precalienta el horno a 180 °C.","Mezcla mantequilla, azúcar y huevo; agrega harina y avena.","Forma bolitas y aplánalas sobre una charola.","Hornea 12 minutos."]'),
('Cheesecake sin horno','Base de galleta y relleno cremoso.','🍰',3,40,'["licuadora","refrigerador"]','["lacteos","gluten"]','["sin horno","cremoso"]',
 '["200 g de galleta molida","80 g de mantequilla derretida","400 g de queso crema","1 lata de leche condensada","1/2 taza de jugo de limón"]',
 '["Mezcla la galleta con la mantequilla y presiona en un molde.","Licúa queso crema, leche condensada y limón.","Vierte sobre la base.","Refrigera 6 horas."]'),
('Brownies','Densos y con costra brillante.','🟫',3,50,'["horno"]','["gluten","lacteos","huevo"]','["horneado","chocolate"]',
 '["150 g de chocolate","120 g de mantequilla","3/4 taza de azúcar","2 huevos","1/2 taza de harina"]',
 '["Precalienta el horno a 175 °C y engrasa un molde.","Derrite chocolate con mantequilla y deja entibiar.","Agrega azúcar, huevos y harina, mezclando lo justo.","Hornea 25 minutos."]'),
('Flan napolitano','Flan de caramelo suave.','🍮',3,75,'["horno","estufa","licuadora"]','["lacteos","huevo"]','["horneado","clásico"]',
 '["1 lata de leche condensada","1 lata de leche evaporada","4 huevos","1 cucharadita de vainilla","1/2 taza de azúcar para el caramelo"]',
 '["Haz caramelo con el azúcar en la estufa y cubre el molde.","Licúa leches, huevos y vainilla.","Vierte en el molde y hornea a baño maría a 180 °C por 50 minutos.","Enfría y refrigera antes de desmoldar."]'),
('Crepas con cajeta','Crepas delgadas rellenas de cajeta.','🥞',3,40,'["sarten","licuadora"]','["gluten","lacteos","huevo"]','["clásico","sartén"]',
 '["1 taza de harina","1 taza de leche","2 huevos","1 cucharada de mantequilla derretida","Cajeta al gusto"]',
 '["Licúa harina, leche, huevos y mantequilla.","Deja reposar la mezcla 15 minutos.","Cocina cada crepa en sartén caliente, medio minuto por lado.","Unta cajeta y dobla."]'),
('Tarta de manzana','Masa quebrada con manzana y canela.','🍎',4,90,'["horno"]','["gluten","lacteos"]','["horneado","frutal"]',
 '["1 1/2 tazas de harina","100 g de mantequilla fría","4 manzanas","3 cucharadas de azúcar","1 cucharadita de canela"]',
 '["Mezcla harina y mantequilla fría con agua helada hasta formar masa y reposa 30 minutos.","Rebana las manzanas y mézclalas con azúcar y canela.","Extiende la masa en un molde, rellena y cubre.","Hornea a 190 °C por 40 minutos."]'),
('Pastel de chocolate','Bizcocho esponjoso de chocolate.','🎂',4,80,'["horno","batidora"]','["gluten","lacteos","huevo"]','["horneado","chocolate"]',
 '["2 tazas de harina","1 taza de cacao","1 1/2 tazas de azúcar","3 huevos","1 taza de leche","1/2 taza de aceite","2 cucharaditas de polvo para hornear"]',
 '["Precalienta el horno a 180 °C y engrasa dos moldes.","Bate huevos, azúcar, leche y aceite.","Agrega los secos cernidos poco a poco.","Hornea 30 minutos y deja enfriar."]'),
('Macarons de almendra','El gran reto: delicados y precisos.','🌸',5,120,'["horno","batidora"]','["frutos_secos","huevo"]','["horneado","avanzado"]',
 '["100 g de harina de almendra","100 g de azúcar glass","75 g de claras","60 g de azúcar","Relleno al gusto"]',
 '["Cierne la harina de almendra con el azúcar glass.","Bate las claras con el azúcar hasta picos firmes.","Incorpora los secos hasta lograr textura de lava y forma discos con duya.","Reposa 30 minutos y hornea a 150 °C por 17 minutos; rellena al enfriar."]');
