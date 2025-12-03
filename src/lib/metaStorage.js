/**
 * Simple localStorage-based meta storage
 * Stores user-defined goals/targets for devices
 */

const META_PREFIX = 'ecoar_meta_';
const ACTIVATION_META_PREFIX = 'ecoar_activation_meta_';

/**
 * Generate a unique key for storing meta
 */
const generateMetaKey = (deviceId, filterType, periodIndex) => {
  return `${META_PREFIX}${deviceId}_${filterType}_${periodIndex}`;
};

/**
 * Generate a unique key for storing activation meta
 */
const generateActivationMetaKey = (deviceId, filterType, periodIndex) => {
  return `${ACTIVATION_META_PREFIX}${deviceId}_${filterType}_${periodIndex}`;
};

/**
 * Load meta from localStorage
 * @param {Number|String} deviceId - Device ID
 * @param {String} filterType - 'daily' or 'monthly'
 * @param {Number} periodIndex - Period index (month or day)
 * @returns {Number} Saved meta or default value (10000)
 */
export const loadMeta = async (deviceId, filterType, periodIndex) => {
  try {
    const key = generateMetaKey(deviceId, filterType, periodIndex);
    const value = localStorage.getItem(key);
    
    if (value !== null) {
      const parsed = parseFloat(value);
      console.log(`📚 Meta loaded from storage: device ${deviceId}, ${filterType}, index ${periodIndex} = ${parsed}`);
      return parsed;
    }

    console.log(`📚 Meta not found, returning default: device ${deviceId}, ${filterType}, index ${periodIndex}`);
    return 10000;
  } catch (error) {
    console.error('Error loading meta:', error);
    return 10000;
  }
};

/**
 * Save meta to localStorage
 * @param {Number|String} deviceId - Device ID
 * @param {String} filterType - 'daily' or 'monthly'
 * @param {Number} periodIndex - Period index
 * @param {Number} value - Meta value to save
 * @returns {boolean} Success status
 */
export const saveMeta = async (deviceId, filterType, periodIndex, value) => {
  try {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      console.error('Invalid meta value:', value);
      return false;
    }

    const key = generateMetaKey(deviceId, filterType, periodIndex);
    localStorage.setItem(key, numValue.toString());
    
    console.log(`✅ Meta saved to storage: device ${deviceId}, ${filterType}, index ${periodIndex} = ${numValue}`);
    return true;
  } catch (error) {
    console.error('Error saving meta:', error);
    return false;
  }
};

/**
 * Load activation meta from localStorage (or API data)
 * @param {Number|String} deviceId - Device ID
 * @param {String} filterType - 'daily' or 'monthly'
 * @param {Number} periodIndex - Period index
 * @param {Object} apiData - Optional API data to check for meta_tempo_atuacao
 * @returns {Number} Saved activation time meta in hours or default value from API
 */
export const loadActivationMeta = async (deviceId, filterType, periodIndex, apiData = null) => {
  try {
    // First, check localStorage for user-saved values
    const key = generateActivationMetaKey(deviceId, filterType, periodIndex);
    const value = localStorage.getItem(key);

    if (value !== null) {
      const parsed = parseFloat(value);
      console.log(`⏱️ Activation meta loaded from storage: device ${deviceId}, ${filterType}, index ${periodIndex} = ${parsed}h`);
      return parsed;
    }

    // If API data is provided, try to get value from API
    if (apiData) {
      if (filterType === 'daily' && Array.isArray(apiData.meta_tempo_atuacao_diaria)) {
        const apiValue = apiData.meta_tempo_atuacao_diaria[periodIndex];
        if (apiValue !== undefined && apiValue !== null && !isNaN(apiValue)) {
          const parsed = parseFloat(apiValue);
          console.log(`⏱️ Activation meta loaded from API (daily): device ${deviceId}, index ${periodIndex} = ${parsed}h`);
          return parsed;
        }
      }

      if (filterType === 'monthly' && Array.isArray(apiData.meta_tempo_atuacao_mensal)) {
        const apiValue = apiData.meta_tempo_atuacao_mensal[periodIndex];
        if (apiValue !== undefined && apiValue !== null && !isNaN(apiValue)) {
          const parsed = parseFloat(apiValue);
          console.log(`⏱️ Activation meta loaded from API (monthly): device ${deviceId}, index ${periodIndex} = ${parsed}h`);
          return parsed;
        }
      }
    }

    // Fallback to default
    const defaultValue = filterType === 'daily' ? 24 : 720;
    console.log(`⏱️ Activation meta not found in storage or API, returning default: ${defaultValue}h`);
    return defaultValue;
  } catch (error) {
    console.error('Error loading activation meta:', error);
    return filterType === 'daily' ? 24 : 720;
  }
};

/**
 * Save activation meta to localStorage
 * @param {Number|String} deviceId - Device ID
 * @param {String} filterType - 'daily' or 'monthly'
 * @param {Number} periodIndex - Period index
 * @param {Number} value - Activation time meta in hours
 * @returns {boolean} Success status
 */
export const saveActivationMeta = async (deviceId, filterType, periodIndex, value) => {
  try {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      console.error('Invalid activation meta value:', value);
      return false;
    }

    const key = generateActivationMetaKey(deviceId, filterType, periodIndex);
    localStorage.setItem(key, numValue.toString());
    
    console.log(`✅ Activation meta saved: device ${deviceId}, ${filterType}, index ${periodIndex} = ${numValue}h`);
    return true;
  } catch (error) {
    console.error('Error saving activation meta:', error);
    return false;
  }
};

/**
 * Get all metas for a device
 * @param {Number|String} deviceId - Device ID
 * @returns {Array} Array of stored metas
 */
export const getAllMetas = async (deviceId) => {
  try {
    const prefix = `${META_PREFIX}${deviceId}`;
    const results = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        const parts = key.replace(prefix + '_', '').split('_');
        results.push({
          deviceId,
          filterType: parts[0],
          periodIndex: parseInt(parts[1]),
          value: parseFloat(value)
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
};

/**
 * Delete meta
 * @param {Number|String} deviceId - Device ID
 * @param {String} filterType - 'daily' or 'monthly'
 * @param {Number} periodIndex - Period index
 */
export const deleteMeta = async (deviceId, filterType, periodIndex) => {
  try {
    const key = generateMetaKey(deviceId, filterType, periodIndex);
    localStorage.removeItem(key);
    console.log(`🗑️ Meta deletada do storage para dispositivo ${deviceId}`);
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
  }
};

/**
 * Clear all data (useful for testing/reset)
 */
export const clearDatabase = async () => {
  try {
    // Remove all meta and activation meta keys
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(META_PREFIX) || key.startsWith(ACTIVATION_META_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('✅ Banco de dados limpo');
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
  }
};
