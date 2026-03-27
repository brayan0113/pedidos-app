const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data.db');
const sqlite = new Database(DB_PATH);

// ─── ESQUEMA ──────────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id          TEXT PRIMARY KEY,
    cliente     TEXT NOT NULL,
    telefono    TEXT DEFAULT '',
    productos   TEXT DEFAULT '[]',
    total       REAL DEFAULT 0,
    direccion   TEXT DEFAULT '',
    notas       TEXT DEFAULT '',
    estado      TEXT DEFAULT 'nuevo',
    fecha       TEXT NOT NULL,
    fuente      TEXT DEFAULT 'whatsapp',
    atendido_por TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria   TEXT DEFAULT 'General',
    precio      REAL DEFAULT 0,
    disponible  INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id       TEXT PRIMARY KEY,
    nombre   TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol      TEXT NOT NULL DEFAULT 'mesero'
  );
`);

// ─── MIGRACIÓN: columna atendido_por (por si la tabla ya existía) ─────────────
try {
  sqlite.exec(`ALTER TABLE pedidos ADD COLUMN atendido_por TEXT DEFAULT ''`);
} catch (_) { /* columna ya existe */ }

// ─── SEED USUARIOS INICIALES ──────────────────────────────────────────────────
const userCount = sqlite.prepare('SELECT COUNT(*) as c FROM usuarios').get().c;
if (userCount === 0) {
  sqlite.prepare('INSERT INTO usuarios VALUES (?, ?, ?, ?, ?)').run(
    'usr-admin-default', 'Administrador', 'admin', bcrypt.hashSync('admin123', 10), 'admin'
  );
  sqlite.prepare('INSERT INTO usuarios VALUES (?, ?, ?, ?, ?)').run(
    'usr-mesero-default', 'Mesero', 'mesero', bcrypt.hashSync('mesero123', 10), 'mesero'
  );
  console.log('✅ Usuarios creados: admin/admin123  |  mesero/mesero123');
}

// helpers
const parsePedido = (row) => row ? { ...row, productos: JSON.parse(row.productos || '[]') } : null;
const parseItem   = (row) => row ? { ...row, disponible: row.disponible === 1 } : null;

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
const getPedidos = (estado) => {
  const rows = estado && estado !== 'todos'
    ? sqlite.prepare('SELECT * FROM pedidos WHERE estado = ? ORDER BY fecha DESC').all(estado)
    : sqlite.prepare('SELECT * FROM pedidos ORDER BY fecha DESC').all();
  return rows.map(parsePedido);
};

const getPedido = (id) => parsePedido(sqlite.prepare('SELECT * FROM pedidos WHERE id = ?').get(id));

const insertPedido = (pedido) => {
  sqlite.prepare(`
    INSERT INTO pedidos (id, cliente, telefono, productos, total, direccion, notas, estado, fecha, fuente, atendido_por)
    VALUES (@id, @cliente, @telefono, @productos, @total, @direccion, @notas, @estado, @fecha, @fuente, @atendido_por)
  `).run({
    ...pedido,
    productos: JSON.stringify(pedido.productos || []),
    atendido_por: pedido.atendido_por || ''
  });
};

const updateEstado = (id, estado) => {
  const result = sqlite.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id);
  return result.changes > 0;
};

const deletePedido = (id) => {
  const result = sqlite.prepare('DELETE FROM pedidos WHERE id = ?').run(id);
  return result.changes > 0;
};

const deleteAllPedidos = () => {
  const result = sqlite.prepare('DELETE FROM pedidos').run();
  return result.changes;
};

const getStats = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const all = sqlite.prepare('SELECT estado, total, fecha FROM pedidos').all();
  return {
    total:      all.length,
    nuevo:      all.filter(p => p.estado === 'nuevo').length,
    en_proceso: all.filter(p => p.estado === 'en_proceso').length,
    listo:      all.filter(p => p.estado === 'listo').length,
    entregado:  all.filter(p => p.estado === 'entregado').length,
    cancelado:  all.filter(p => p.estado === 'cancelado').length,
    ingresos_hoy: all
      .filter(p => p.estado !== 'cancelado' && p.fecha.startsWith(hoy))
      .reduce((s, p) => s + (p.total || 0), 0),
    ingresos_total: all
      .filter(p => p.estado !== 'cancelado')
      .reduce((s, p) => s + (p.total || 0), 0)
  };
};

// ─── MENÚ ─────────────────────────────────────────────────────────────────────
const getItems = () =>
  sqlite.prepare('SELECT * FROM menu_items ORDER BY categoria, nombre').all().map(parseItem);

const getItemsDisponibles = () =>
  sqlite.prepare('SELECT * FROM menu_items WHERE disponible = 1 ORDER BY categoria, nombre').all().map(parseItem);

const getItem = (id) => parseItem(sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(id));

const insertItem = (item) => {
  sqlite.prepare(`
    INSERT INTO menu_items (id, nombre, descripcion, categoria, precio, disponible)
    VALUES (@id, @nombre, @descripcion, @categoria, @precio, @disponible)
  `).run({ ...item, disponible: item.disponible ? 1 : 0 });
};

const updateItem = (id, campos) => {
  const allowed = ['nombre', 'descripcion', 'categoria', 'precio', 'disponible'];
  const updates = Object.keys(campos).filter(k => allowed.includes(k));
  if (updates.length === 0) return false;

  const values = {};
  updates.forEach(k => { values[k] = k === 'disponible' ? (campos[k] ? 1 : 0) : campos[k]; });
  values.id = id;

  const set = updates.map(k => `${k} = @${k}`).join(', ');
  const result = sqlite.prepare(`UPDATE menu_items SET ${set} WHERE id = @id`).run(values);
  return result.changes > 0;
};

const deleteItem = (id) => {
  const result = sqlite.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  return result.changes > 0;
};

const verificarDisponibilidad = (nombres) => {
  const items = getItems();
  const normalize = s => s.toLowerCase().trim();
  const disponibles = [];
  const no_disponibles = [];

  for (const nombre of nombres) {
    const norm = normalize(nombre);
    const match = items.find(i => normalize(i.nombre).includes(norm) || norm.includes(normalize(i.nombre)));
    if (!match) {
      no_disponibles.push({ nombre, razon: 'No existe en el menú' });
    } else if (!match.disponible) {
      no_disponibles.push({ nombre, razon: 'Agotado temporalmente', item: match });
    } else {
      disponibles.push({ nombre, item: match });
    }
  }

  return { disponibles, no_disponibles, todos_disponibles: no_disponibles.length === 0 };
};

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
const getUserByUsername = (username) =>
  sqlite.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);

const getUsuarios = () =>
  sqlite.prepare('SELECT id, nombre, username, rol FROM usuarios ORDER BY rol, nombre').all();

const createUsuario = ({ id, nombre, username, password, rol }) => {
  sqlite.prepare('INSERT INTO usuarios (id, nombre, username, password, rol) VALUES (?, ?, ?, ?, ?)')
    .run(id, nombre, username, bcrypt.hashSync(password, 10), rol);
};

const deleteUsuario = (id) => {
  const result = sqlite.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  return result.changes > 0;
};

const updateUsuarioPassword = (id, newPassword) => {
  const result = sqlite.prepare('UPDATE usuarios SET password = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), id);
  return result.changes > 0;
};

module.exports = {
  getPedidos, getPedido, insertPedido, updateEstado, deletePedido, deleteAllPedidos, getStats,
  getItems, getItemsDisponibles, getItem, insertItem, updateItem, deleteItem, verificarDisponibilidad,
  getUserByUsername, getUsuarios, createUsuario, deleteUsuario, updateUsuarioPassword
};
