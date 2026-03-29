import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('salesapp.db');

export function initDatabase(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      nombre TEXT NOT NULL,
      telefono TEXT,
      direccion TEXT,
      latitud REAL,
      longitud REAL,
      notas TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      categoria TEXT,
      sku TEXT,
      stock INTEGER DEFAULT 0,
      imagen_url TEXT,
      activo INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      client_id INTEGER NOT NULL,
      client_nombre TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      notas TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ── Clients ───────────────────────────────────────────────────────────────────

export interface LocalClient {
  id?: number;
  server_id?: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
  synced?: number;
  created_at?: string;
}

export function insertClient(client: LocalClient): number {
  const result = db.runSync(
    `INSERT INTO clients (nombre, telefono, direccion, latitud, longitud, notas, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [client.nombre, client.telefono ?? null, client.direccion ?? null,
     client.latitud ?? null, client.longitud ?? null, client.notas ?? null]
  );
  return result.lastInsertRowId;
}

export function getAllClients(): LocalClient[] {
  return db.getAllSync<LocalClient>('SELECT * FROM clients ORDER BY nombre');
}

export function searchClients(query: string): LocalClient[] {
  return db.getAllSync<LocalClient>(
    `SELECT * FROM clients WHERE nombre LIKE ? ORDER BY nombre`,
    [`%${query}%`]
  );
}

export function getUnsyncedClients(): LocalClient[] {
  return db.getAllSync<LocalClient>('SELECT * FROM clients WHERE synced = 0');
}

export function markClientSynced(localId: number, serverId: number): void {
  db.runSync('UPDATE clients SET synced = 1, server_id = ? WHERE id = ?', [serverId, localId]);
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface LocalProduct {
  id?: number;
  server_id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  sku?: string;
  stock?: number;
  imagen_url?: string;
  activo?: number;
}

export function upsertProduct(product: LocalProduct): void {
  if (product.server_id) {
    const existing = db.getFirstSync<LocalProduct>(
      'SELECT id FROM products WHERE server_id = ?',
      [product.server_id]
    );
    if (existing) {
      db.runSync(
        `UPDATE products SET nombre=?, descripcion=?, precio=?, categoria=?, sku=?, stock=?, imagen_url=?, activo=?, updated_at=datetime('now')
         WHERE server_id=?`,
        [product.nombre, product.descripcion ?? null, product.precio,
         product.categoria ?? null, product.sku ?? null, product.stock ?? 0,
         product.imagen_url ?? null, product.activo ?? 1, product.server_id]
      );
      return;
    }
  }
  db.runSync(
    `INSERT INTO products (server_id, nombre, descripcion, precio, categoria, sku, stock, imagen_url, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [product.server_id ?? null, product.nombre, product.descripcion ?? null,
     product.precio, product.categoria ?? null, product.sku ?? null,
     product.stock ?? 0, product.imagen_url ?? null, product.activo ?? 1]
  );
}

export function getAllProducts(): LocalProduct[] {
  return db.getAllSync<LocalProduct>('SELECT * FROM products WHERE activo = 1 ORDER BY nombre');
}

export function getProductsByCategory(categoria: string): LocalProduct[] {
  return db.getAllSync<LocalProduct>(
    'SELECT * FROM products WHERE categoria = ? AND activo = 1 ORDER BY nombre',
    [categoria]
  );
}

export function getCategories(): string[] {
  const rows = db.getAllSync<{ categoria: string }>(
    'SELECT DISTINCT categoria FROM products WHERE categoria IS NOT NULL AND activo = 1'
  );
  return rows.map(r => r.categoria);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface LocalOrder {
  id?: number;
  server_id?: number;
  client_id: number;
  client_nombre?: string;
  items: string; // JSON string
  total: number;
  estado?: string;
  notas?: string;
  synced?: number;
  created_at?: string;
}

export function insertOrder(order: LocalOrder): number {
  const result = db.runSync(
    `INSERT INTO orders (client_id, client_nombre, items, total, estado, notas, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [order.client_id, order.client_nombre ?? null, order.items,
     order.total, order.estado ?? 'pendiente', order.notas ?? null]
  );
  return result.lastInsertRowId;
}

export function getAllOrders(): LocalOrder[] {
  return db.getAllSync<LocalOrder>('SELECT * FROM orders ORDER BY created_at DESC');
}

export function getTodayOrders(): LocalOrder[] {
  return db.getAllSync<LocalOrder>(
    `SELECT * FROM orders WHERE date(created_at) = date('now') ORDER BY created_at DESC`
  );
}

export function getUnsyncedOrders(): LocalOrder[] {
  return db.getAllSync<LocalOrder>('SELECT * FROM orders WHERE synced = 0');
}

export function markOrderSynced(localId: number, serverId: number): void {
  db.runSync('UPDATE orders SET synced = 1, server_id = ? WHERE id = ?', [serverId, localId]);
}

export default db;
