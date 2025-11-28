import initSqlJs from 'sql.js';

let SQL = null;
let db = null;
const DB_STORAGE_KEY = 'ecoar_sqlite_db';
let initPromise = null;

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const canUseLocalStorage = isLocalStorageAvailable();

/**
 * Initialize SQLite database with proper error handling
 */
export const initializeSQL = async () => {
  // Return existing promise if already initializing
  if (initPromise) {
    console.log('📖 Database initialization already in progress, returning existing promise');
    return initPromise;
  }

  // Return existing database if already initialized
  if (SQL && db) {
    console.log('📖 Database already initialized, returning existing instance');
    return db;
  }

  console.log('📖 Starting database initialization...');
  console.log(`📖 localStorage availability: ${canUseLocalStorage ? 'YES' : 'NO (data will be session-only)'}`);

  initPromise = (async () => {
    try {
      if (!SQL) {
        console.log('📖 Loading SQL.js library...');

        try {
          // Get the base URL for WASM file location
          const baseUrl = import.meta.env.BASE_URL || '/';
          const wasmPath = `${baseUrl}sql-wasm.wasm`;

          SQL = await initSqlJs({
            locateFile: file => {
              console.log('📖 Locating WASM file:', file, '-> using path:', wasmPath);
              return wasmPath;
            }
          });
          console.log('✅ SQL.js library loaded successfully');
        } catch (sqlError) {
          console.error('❌ Failed to load SQL.js library:', sqlError);
          throw sqlError;
        }
      }

      // Verify SQL is properly loaded
      if (!SQL || typeof SQL.Database !== 'function') {
        console.error('❌ SQL.js library not properly loaded');
        throw new Error('SQL.js library not properly initialized');
      }

      // Try to load existing database from localStorage
      let savedData = null;
      try {
        savedData = localStorage.getItem(DB_STORAGE_KEY);
      } catch (localStorageError) {
        console.warn('⚠️ Error accessing localStorage:', localStorageError);
      }

      if (savedData) {
        try {
          console.log('📖 Found saved database in localStorage, attempting to load...');
          const data = new Uint8Array(JSON.parse(savedData));
          db = new SQL.Database(data);
          console.log('✅ Database loaded from localStorage successfully');
        } catch (parseError) {
          console.warn('⚠️ Error parsing saved database, creating new one:', parseError);
          db = new SQL.Database();
          createTables();
        }
      } else {
        console.log('📖 No saved database found, creating new one...');
        db = new SQL.Database();
        createTables();
        console.log('✅ New database created');
      }

      return db;
    } catch (error) {
      console.error('❌ Critical error initializing database:', error);
      db = null;
      SQL = null;
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
  if (!db) {
    console.error('Cannot create tables: database not initialized');
    return;
  }

  try {
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

    console.log('✅ Database tables created successfully');
    const saved = saveDatabase();
    if (!saved) {
      console.error('⚠️ Failed to save database after creating tables');
    }
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
  }
};

/**
 * Save database to localStorage with error handling
 */
const saveDatabase = () => {
  if (!db) {
    console.warn('Cannot save database: db is null');
    return false;
  }

  try {
    const data = db.export();
    if (!data || data.length === 0) {
      console.warn('Database export returned empty data');
      return false;
    }

    const arr = Array.from(data);

    // Verify array conversion
    if (!Array.isArray(arr) || arr.length === 0) {
      console.error('Failed to convert database to array');
      return false;
    }

    const jsonStr = JSON.stringify(arr);

    // Check localStorage size
    const sizeInKB = jsonStr.length / 1024;
    if (sizeInKB > 5000) {
      console.warn(`Database size is large (${sizeInKB.toFixed(2)} KB), consider archiving old data`);
    }

    // Check if localStorage is available
    if (!canUseLocalStorage) {
      console.warn('⚠️ localStorage is not available (private browsing or restricted environment). Database changes will not persist across page reloads.');
      return true; // Return true since the in-memory database was updated successfully
    }

    localStorage.setItem(DB_STORAGE_KEY, jsonStr);
    console.log(`✅ Database saved to localStorage (${sizeInKB.toFixed(2)} KB)`);
    return true;
  } catch (error) {
    console.error('Error saving database to localStorage:', error);
    // Check if it's a quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Try clearing old data.');
      // Try to clear and retry
      try {
        if (canUseLocalStorage) {
          localStorage.removeItem(DB_STORAGE_KEY);
          console.log('Cleared old database data, please try again');
        }
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    } else if (error.message && error.message.includes('QuotaExceededError')) {
      console.error('Storage quota exceeded.');
    }
    // Return true since the in-memory database was successfully updated
    // even if we couldn't persist it to localStorage
    return true;
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

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO meta (device_id, filter_type, period_index, value, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.bind([String(deviceId), filterType, periodIndex, numValue]);
      stmt.step();
      stmt.free();
    } catch (stmtError) {
      console.error('Error executing INSERT statement:', stmtError);
      return false;
    }

    try {
      const saved = saveDatabase();
      if (!saved) {
        console.error('Failed to save database to localStorage');
        return false;
      }
    } catch (saveError) {
      console.error('Error during database save:', saveError);
      return false;
    }

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

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO activation_meta (device_id, filter_type, period_index, value, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.bind([String(deviceId), filterType, periodIndex, numValue]);
      stmt.step();
      stmt.free();
    } catch (stmtError) {
      console.error('Error executing INSERT statement:', stmtError);
      return false;
    }

    try {
      const saved = saveDatabase();
      if (!saved) {
        console.error('Failed to save activation meta to localStorage');
        return false;
      }
    } catch (saveError) {
      console.error('Error during database save:', saveError);
      return false;
    }

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

// Initialize database on module load (but don't block if it fails)
console.log('📖 Initializing SQLite database module...');
initializeSQL().then(() => {
  console.log('✅ SQLite database module initialized successfully');
}).catch(err => {
  console.warn('⚠️ Database initialization deferred until first use:', err);
});
