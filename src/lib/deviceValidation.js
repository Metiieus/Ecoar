import { getAllDeviceIds } from '../data/devices';

/**
 * Validate device data from API
 * @returns {Promise<Object>} Validation results
 */
export const validateAllDevices = async () => {
  const results = {
    totalDevices: 0,
    successfulDevices: [],
    failedDevices: [],
    dataQualityIssues: []
  };

  const deviceIds = getAllDeviceIds();
  results.totalDevices = deviceIds.length;

  console.log(`🔍 Starting device validation for ${deviceIds.length} devices...`);

  for (const deviceId of deviceIds) {
    try {
      let urlString;
      if (import.meta.env.PROD) {
        const url = new URL('https://tb8calt97j.execute-api.sa-east-1.amazonaws.com/dev/dados');
        url.searchParams.append('device_id', deviceId);
        url.searchParams.append('historico', 'true');
        urlString = url.toString();
      } else {
        const baseUrl = `${window.location.origin}/api/dados`;
        const url = new URL(baseUrl);
        url.searchParams.append('device_id', deviceId);
        url.searchParams.append('historico', 'true');
        urlString = url.toString();
      }

      const response = await fetch(urlString, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        results.failedDevices.push({
          deviceId,
          error: `API returned status ${response.status}`,
          url: urlString
        });
        console.warn(`❌ Device ${deviceId} failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Validate data structure
      const issues = validateDeviceData(deviceId, data);
      if (issues.length > 0) {
        results.dataQualityIssues.push({
          deviceId,
          issues
        });
        console.warn(`⚠️ Device ${deviceId} has data quality issues:`, issues);
      }

      results.successfulDevices.push({
        deviceId,
        dataPoints: {
          consumo_mensal: data.consumo_mensal?.length || 0,
          consumo_diario_mes_corrente: data.consumo_diario_mes_corrente?.length || 0,
          consumo_sem_sistema_mensal: data.consumo_sem_sistema_mensal?.length || 0,
          consumo_sem_sistema_diario: data.consumo_sem_sistema_diario?.length || 0,
          minutos_desligado_mensal: data.minutos_desligado_mensal?.length || 0,
          minutos_desligado_diario: data.minutos_desligado_diario?.length || 0
        }
      });

      console.log(`✅ Device ${deviceId} validated successfully`);
    } catch (error) {
      results.failedDevices.push({
        deviceId,
        error: error.message
      });
      console.error(`❌ Device ${deviceId} validation error:`, error.message);
    }
  }

  // Summary
  console.log('\n📊 Device Validation Summary:');
  console.log(`✅ Successful: ${results.successfulDevices.length}/${results.totalDevices}`);
  console.log(`❌ Failed: ${results.failedDevices.length}/${results.totalDevices}`);
  console.log(`⚠️ Quality Issues: ${results.dataQualityIssues.length}`);

  return results;
};

/**
 * Validate individual device data
 * @param {Number} deviceId - Device ID
 * @param {Object} data - Device data from API
 * @returns {Array} Array of issues found
 */
const validateDeviceData = (deviceId, data) => {
  const issues = [];

  // Check required arrays
  const requiredArrays = [
    'consumo_mensal',
    'consumo_diario_mes_corrente',
    'consumo_sem_sistema_mensal',
    'consumo_sem_sistema_diario',
    'minutos_desligado_mensal',
    'minutos_desligado_diario'
  ];

  for (const arrayName of requiredArrays) {
    if (!Array.isArray(data[arrayName])) {
      issues.push(`Missing or invalid array: ${arrayName}`);
    } else if (data[arrayName].length === 0) {
      issues.push(`Empty array: ${arrayName}`);
    } else {
      // Check for NaN values
      const nanCount = data[arrayName].filter(val => isNaN(Number(val))).length;
      if (nanCount > 0) {
        issues.push(`Array ${arrayName} has ${nanCount} NaN values`);
      }

      // Check for negative values
      const negativeCount = data[arrayName].filter(val => Number(val) < 0).length;
      if (negativeCount > 0) {
        issues.push(`Array ${arrayName} has ${negativeCount} negative values`);
      }
    }
  }

  // Check data consistency
  if (Array.isArray(data.consumo_mensal) && Array.isArray(data.consumo_sem_sistema_mensal)) {
    if (data.consumo_mensal.length !== data.consumo_sem_sistema_mensal.length) {
      issues.push('consumo_mensal and consumo_sem_sistema_mensal have different lengths');
    }
  }

  if (Array.isArray(data.consumo_diario_mes_corrente) && Array.isArray(data.consumo_sem_sistema_diario)) {
    if (data.consumo_diario_mes_corrente.length !== data.consumo_sem_sistema_diario.length) {
      issues.push('consumo_diario_mes_corrente and consumo_sem_sistema_diario have different lengths');
    }
  }

  return issues;
};

/**
 * Check if a specific device has data
 * @param {Number} deviceId - Device ID
 * @returns {Promise<boolean>} True if device has data
 */
export const checkDeviceHasData = async (deviceId) => {
  try {
    let urlString;
    if (import.meta.env.PROD) {
      const url = new URL('https://tb8calt97j.execute-api.sa-east-1.amazonaws.com/dev/dados');
      url.searchParams.append('device_id', deviceId);
      url.searchParams.append('historico', 'false');
      urlString = url.toString();
    } else {
      const baseUrl = `${window.location.origin}/api/dados`;
      const url = new URL(baseUrl);
      url.searchParams.append('device_id', deviceId);
      url.searchParams.append('historico', 'false');
      urlString = url.toString();
    }

    const response = await fetch(urlString, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data && Object.keys(data).length > 0;
  } catch (error) {
    console.error(`Error checking device ${deviceId}:`, error);
    return false;
  }
};

/**
 * Compare device data across periods
 * @param {Number} deviceId - Device ID
 * @returns {Promise<Object>} Comparison results
 */
export const compareDeviceDataPeriods = async (deviceId) => {
  try {
    let urlString;
    if (import.meta.env.PROD) {
      const url = new URL('https://tb8calt97j.execute-api.sa-east-1.amazonaws.com/dev/dados');
      url.searchParams.append('device_id', deviceId);
      url.searchParams.append('historico', 'true');
      urlString = url.toString();
    } else {
      const baseUrl = `${window.location.origin}/api/dados`;
      const url = new URL(baseUrl);
      url.searchParams.append('device_id', deviceId);
      url.searchParams.append('historico', 'true');
      urlString = url.toString();
    }

    const response = await fetch(urlString, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    return {
      deviceId,
      monthlyDataPoints: data.consumo_mensal?.length || 0,
      dailyDataPoints: data.consumo_diario_mes_corrente?.length || 0,
      totalMonthlyConsumption: Array.isArray(data.consumo_mensal) 
        ? data.consumo_mensal.reduce((sum, val) => sum + Number(val), 0)
        : 0,
      totalDailyConsumption: Array.isArray(data.consumo_diario_mes_corrente)
        ? data.consumo_diario_mes_corrente.reduce((sum, val) => sum + Number(val), 0)
        : 0
    };
  } catch (error) {
    console.error(`Error comparing device data for ${deviceId}:`, error);
    return null;
  }
};
