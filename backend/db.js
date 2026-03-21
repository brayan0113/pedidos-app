const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'pedidos.json');
const MENU_FILE = path.join(__dirname, 'menu.json');

function read() {
  if (!fs.existsSync(DB_FILE)) return { pedidos: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { pedidos: [] };
  }
}

function write(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const db = {
  getPedidos(estado) {
    const { pedidos } = read();
    const sorted = pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (estado && estado !== 'todos') return sorted.filter(p => p.estado === estado);
    return sorted;
  },

  getPedido(id) {
    const { pedidos } = read();
    return pedidos.find(p => p.id === id) || null;
  },

  insertPedido(pedido) {
    const data = read();
    data.pedidos.push(pedido);
    write(data);
  },

  updateEstado(id, estado) {
    const data = read();
    const idx = data.pedidos.findIndex(p => p.id === id);
    if (idx === -1) return false;
    data.pedidos[idx].estado = estado;
    write(data);
    return true;
  },

  deletePedido(id) {
    const data = read();
    const before = data.pedidos.length;
    data.pedidos = data.pedidos.filter(p => p.id !== id);
    if (data.pedidos.length === before) return false;
    write(data);
    return true;
  },

  getStats() {
    const { pedidos } = read();
    const hoy = new Date().toDateString();
    return {
      total: pedidos.length,
      nuevo: pedidos.filter(p => p.estado === 'nuevo').length,
      en_proceso: pedidos.filter(p => p.estado === 'en_proceso').length,
      listo: pedidos.filter(p => p.estado === 'listo').length,
      entregado: pedidos.filter(p => p.estado === 'entregado').length,
      cancelado: pedidos.filter(p => p.estado === 'cancelado').length,
      ingresos_hoy: pedidos
        .filter(p => p.estado !== 'cancelado' && new Date(p.fecha).toDateString() === hoy)
        .reduce((s, p) => s + (p.total || 0), 0),
      ingresos_total: pedidos
        .filter(p => p.estado !== 'cancelado')
        .reduce((s, p) => s + (p.total || 0), 0)
    };
  }
};

// ─── MENÚ ─────────────────────────────────────────────────────────────────────

function readMenu() {
  if (!fs.existsSync(MENU_FILE)) return { items: [] };
  try {
    return JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function writeMenu(data) {
  fs.writeFileSync(MENU_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const menuDb = {
  getItems() {
    const { items } = readMenu();
    return items;
  },

  getItemsDisponibles() {
    const { items } = readMenu();
    return items.filter(i => i.disponible);
  },

  getItem(id) {
    const { items } = readMenu();
    return items.find(i => i.id === id) || null;
  },

  insertItem(item) {
    const data = readMenu();
    data.items.push(item);
    writeMenu(data);
  },

  updateItem(id, campos) {
    const data = readMenu();
    const idx = data.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    data.items[idx] = { ...data.items[idx], ...campos };
    writeMenu(data);
    return true;
  },

  deleteItem(id) {
    const data = readMenu();
    const before = data.items.length;
    data.items = data.items.filter(i => i.id !== id);
    if (data.items.length === before) return false;
    writeMenu(data);
    return true;
  },

  // Verifica si una lista de nombres de ítems están disponibles
  // Hace matching flexible (minúsculas, sin tildes no requeridas)
  verificarDisponibilidad(nombres) {
    const { items } = readMenu();
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

    return {
      disponibles,
      no_disponibles,
      todos_disponibles: no_disponibles.length === 0
    };
  }
};

module.exports = { ...db, ...menuDb };
