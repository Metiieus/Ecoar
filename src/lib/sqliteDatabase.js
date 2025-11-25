import initSqlJs from 'sql.js';

let SQL = null;
let db = null;
const DB_STORAGE_KEY = 'ecoar_sqlite_db';
let initPromise = null;

/**
 * Initialize SQLite database with proper error handling
 */
export const initializeSQL = async () => {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  // Return existing database if already initialized
  if (SQL && db) {
    return db;
  }

  initPromise = (async () => {
    try {
      if (!SQL) {
        SQL = await initSqlJs();
      }

      // Try to load existing database from localStorage
      const savedData = localStorage.getItem(DB_STORAGE_KEY);

      if (savedData) {
        try {
          const data = new Uint8Array(JSON.parse(savedData));
          db = new SQL.Database(data);
          console.log('✅ Database loaded from localStorage');
        } catch (parseError) {
          console.warn('Error parsing saved database, creating new one:', parseError);
          db = new SQL.Database();
          createTables();
        }
      } else {
        db = new SQL.Database();
        // Create tables if new database
        createTables();
        console.log('✅ New database created');
      }

      return db;
    } catch (error) {
      console.error('Critical error initializing database:', error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
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
 * Save database to localStorage with error handling
 */
const saveDatabase = () => {
  if (!db) {
    console.warn('Cannot save database: db is null');
    return;
  }

  try {
    const data = db.export();
    const arr = Array.from(data);
    const jsonStr = JSON.stringify(arr);

    // Check localStorage size
    const sizeInKB = jsonStr.length / 1024;
    if (sizeInKB > 5000) {
      console.warn(`Database size is large (${sizeInKB.toFixed(2)} KB), consider archiving old data`);
    }

    localStorage.setItem(DB_STORAGE_KEY, jsonStr);
    console.log(`✅ Database saved to localStorage (${sizeInKB.toFixed(2)} KB)`);
  } catch (error) {
    console.error('Error saving database to localStorage:', error);
    // Check if it's a quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Try clearing old data.');
    }
  }
};

/**
 * Load meta from database
 */
export const loadMeta = async (deviceId, filterType, periodIndex) => {
  try {
    await initializeSQL();

    if (!db) {
      console.error('Database not initialized');
      return 10000;
    }

    const stmt = db.prepare(`
      SELECT value FROM meta
      WHERE device_id = ? AND filter_type = ? AND period_index = ?
    `);

    stmt.bind([String(deviceId), filterType, periodIndex]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      const value = row.value;
      stmt.free();
      console.log(`📚 Meta loaded from database: device ${deviceId}, ${filterType}, index ${periodIndex} = ${value}`);
      return value;
    }

    stmt.free();
  } catch (error) {
    console.error('Error loading meta:', error);
  }

  // Default value if not found
  console.log(`📚 Meta not found, returning default: device ${deviceId}, ${filterType}, index ${periodIndex}`);
  return 10000;
};

/**
 * Save meta to database
 */
export const saveMeta = async (deviceId, filterType, periodIndex, value) => {
  try {
    await initializeSQL();

    if (!db) {
      console.error('Database not initialized, cannot save meta');
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      console.error('Invalid meta value:', value);
      return false;
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO meta (device_id, filter_type, period_index, value, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.bind([String(deviceId), filterType, periodIndex, numValue]);
    stmt.step();
    stmt.free();

    saveDatabase();
    console.log(`✅ Meta saved to database: device ${deviceId}, ${filterType}, index ${periodIndex} = ${numValue}`);
    return true;
  } catch (error) {
    console.error('Error saving meta:', error);
    return false;
  }
};

/**
 * Load activation meta from database
 */
export const loadActivationMeta = async (deviceId, filterType, periodIndex) => {
  try {
    await initializeSQL();

    if (!db) {
      console.error('Database not initialized');
      return filterType === 'daily' ? 24 : 720;
    }

    const stmt = db.prepare(`
      SELECT value FROM activation_meta
      WHERE device_id = ? AND filter_type = ? AND period_index = ?
    `);

    stmt.bind([String(deviceId), filterType, periodIndex]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      const value = row.value;
      stmt.free();
      console.log(`⏱️ Activation meta loaded: device ${deviceId}, ${filterType}, index ${periodIndex} = ${value}h`);
      return value;
    }

    stmt.free();
  } catch (error) {
    console.error('Error loading activation meta:', error);
  }

  // Default values
  const defaultValue = filterType === 'daily' ? 24 : 720;
  console.log(`⏱️ Activation meta not found, returning default: ${defaultValue}h`);
  return defaultValue;
};

/**
 * Save activation meta to database
 */
export const saveActivationMeta = async (deviceId, filterType, periodIndex, value) => {
  try {
    await initializeSQL();

    if (!db) {
      console.error('Database not initialized, cannot save activation meta');
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      console.error('Invalid activation meta value:', value);
      return false;
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO activation_meta (device_id, filter_type, period_index, value, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.bind([String(deviceId), filterType, periodIndex, numValue]);
    stmt.step();
    stmt.free();

    saveDatabase();
    console.log(`✅ Activation meta saved: device ${deviceId}, ${filterType}, index ${periodIndex} = ${numValue}h`);
    return true;
  } catch (error) {
    console.error('Error saving activation meta:', error);
    return false;
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
