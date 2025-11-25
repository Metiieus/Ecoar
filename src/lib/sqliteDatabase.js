import initSqlJs from 'sql.js';

let SQL = null;
let db = null;
const DB_STORAGE_KEY = 'ecoar_sqlite_db';

/**
 * Initialize SQLite database
 */
export const initializeSQL = async () => {
  if (SQL && db) {
    return db;
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Try to load existing database from localStorage
  const savedData = localStorage.getItem(DB_STORAGE_KEY);
  
  if (savedData) {
    const data = new Uint8Array(JSON.parse(savedData));
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
    // Create tables if new database
    createTables();
  }

  return db;
};

/**
 * Create database tables
 */
const createTables = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      filter_type TEXT NOT NULL,
      period_index INTEGER NOT NULL,
      value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(device_id, filter_type, period_index)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activation_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      filter_type TEXT NOT NULL,
      period_index INTEGER NOT NULL,
      value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(device_id, filter_type, period_index)
    )
  `);

  saveDatabase();
};

/**
 * Save database to localStorage
 */
const saveDatabase = () => {
  if (!db) return;
  
  const data = db.export();
  const arr = Array.from(data);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(arr));
};

/**
 * Load meta from database
 */
export const loadMeta = async (deviceId, filterType, periodIndex) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      SELECT value FROM meta 
      WHERE device_id = ? AND filter_type = ? AND period_index = ?
    `);

    stmt.bind([String(deviceId), filterType, periodIndex]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.value;
    }

    stmt.free();
  } catch (error) {
    console.error('Erro ao carregar meta:', error);
  }

  // Default value if not found
  return 10000;
};

/**
 * Save meta to database
 */
export const saveMeta = async (deviceId, filterType, periodIndex, value) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO meta (device_id, filter_type, period_index, value, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.bind([String(deviceId), filterType, periodIndex, parseFloat(value)]);
    stmt.step();
    stmt.free();

    saveDatabase();
    console.log(`📊 Meta salva no SQLite para dispositivo ${deviceId}:`, value);
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
  }
};

/**
 * Load activation meta from database
 */
export const loadActivationMeta = async (deviceId, filterType, periodIndex) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      SELECT value FROM activation_meta 
      WHERE device_id = ? AND filter_type = ? AND period_index = ?
    `);

    stmt.bind([String(deviceId), filterType, periodIndex]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.value;
    }

    stmt.free();
  } catch (error) {
    console.error('Erro ao carregar meta de ativação:', error);
  }

  // Default values
  return filterType === 'daily' ? 24 : 720;
};

/**
 * Save activation meta to database
 */
export const saveActivationMeta = async (deviceId, filterType, periodIndex, value) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO activation_meta (device_id, filter_type, period_index, value, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.bind([String(deviceId), filterType, periodIndex, parseFloat(value)]);
    stmt.step();
    stmt.free();

    saveDatabase();
    console.log(`⏱️ Meta de tempo salva no SQLite para dispositivo ${deviceId}:`, value);
  } catch (error) {
    console.error('Erro ao salvar meta de ativação:', error);
  }
};

/**
 * Get all metas for a device
 */
export const getAllMetas = async (deviceId) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      SELECT * FROM meta WHERE device_id = ? ORDER BY updated_at DESC
    `);

    stmt.bind([String(deviceId)]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();
    return results;
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
};

/**
 * Delete meta
 */
export const deleteMeta = async (deviceId, filterType, periodIndex) => {
  await initializeSQL();

  try {
    const stmt = db.prepare(`
      DELETE FROM meta 
      WHERE device_id = ? AND filter_type = ? AND period_index = ?
    `);

    stmt.bind([String(deviceId), filterType, periodIndex]);
    stmt.step();
    stmt.free();

    saveDatabase();
    console.log(`🗑️ Meta deletada do SQLite para dispositivo ${deviceId}`);
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
  }
};

/**
 * Clear all data (useful for testing/reset)
 */
export const clearDatabase = async () => {
  await initializeSQL();

  try {
    db.run('DELETE FROM meta');
    db.run('DELETE FROM activation_meta');
    saveDatabase();
    console.log('✅ Banco de dados limpo');
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
  }
};
