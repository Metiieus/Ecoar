/**
 * Validador de integridade de dados dos dispositivos
 * Verifica se os dados da API estão corretos e consistentes
 */

const DEVICES = [33, 36, 37, 38, 39, 40, 41, 42];
const API_URL = 'https://tb8calt97j.execute-api.sa-east-1.amazonaws.com/dev/dados';

/**
 * Busca dados de um dispositivo da API
 */
export const fetchDeviceData = async (deviceId) => {
  try {
    const url = new URL(API_URL);
    url.searchParams.append('device_id', deviceId);
    url.searchParams.append('historico', 'true');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro ao buscar dispositivo ${deviceId}:`, error);
    return null;
  }
};

/**
 * Valida a estrutura de dados de um dispositivo
 */
const validateStructure = (deviceId, data) => {
  const requiredFields = [
    'consumo_mensal',
    'consumo_diario_mes_corrente',
    'consumo_sem_sistema_mensal',
    'consumo_sem_sistema_diario',
    'minutos_desligado_mensal',
    'minutos_desligado_diario',
    'ocupacao_mensal',
    'ocupacao_diaria'
  ];

  const issues = [];

  for (const field of requiredFields) {
    if (!Array.isArray(data[field])) {
      issues.push(`❌ Campo ${field} não é um array`);
    } else if (data[field].length === 0) {
      issues.push(`❌ Campo ${field} está vazio`);
    }
  }

  return issues;
};

/**
 * Valida se os valores estão dentro de ranges esperados
 */
const validateValueRanges = (deviceId, data) => {
  const issues = [];

  // Consumo não deve ser negativo
  if (data.consumo_mensal?.some(v => v < 0)) {
    issues.push(`❌ consumo_mensal contém valores negativos`);
  }
  if (data.consumo_diario_mes_corrente?.some(v => v < 0)) {
    issues.push(`❌ consumo_diario_mes_corrente contém valores negativos`);
  }

  // Consumo sem sistema não deve ser negativo
  if (data.consumo_sem_sistema_mensal?.some(v => v < 0)) {
    issues.push(`❌ consumo_sem_sistema_mensal contém valores negativos`);
  }
  if (data.consumo_sem_sistema_diario?.some(v => v < 0)) {
    issues.push(`❌ consumo_sem_sistema_diario contém valores negativos`);
  }

  // Minutos desligado não deve ser negativo
  if (data.minutos_desligado_mensal?.some(v => v < 0)) {
    issues.push(`❌ minutos_desligado_mensal contém valores negativos`);
  }
  if (data.minutos_desligado_diario?.some(v => v < 0)) {
    issues.push(`❌ minutos_desligado_diario contém valores negativos`);
  }

  // Ocupação deve estar entre 0 e 100
  if (data.ocupacao_mensal?.some(v => v < 0 || v > 100)) {
    issues.push(`❌ ocupacao_mensal contém valores fora do range 0-100`);
  }
  if (data.ocupacao_diaria?.some(v => v < 0 || v > 100)) {
    issues.push(`❌ ocupacao_diaria contém valores fora do range 0-100`);
  }

  // Consumo sem sistema não deve ser maior que consumo total
  const monthlyConsumoDiff = data.consumo_mensal?.some((val, idx) => {
    const total = val + (data.consumo_sem_sistema_mensal?.[idx] || 0);
    return total < 0;
  });
  if (monthlyConsumoDiff) {
    issues.push(`⚠️ Soma de consumo_mensal + consumo_sem_sistema_mensal pode estar inconsistente`);
  }

  return issues;
};

/**
 * Valida se existem NaN ou undefined
 */
const validateNaN = (deviceId, data) => {
  const issues = [];
  const tolerance = 0.01;

  const checkArray = (fieldName, arr) => {
    if (!Array.isArray(arr)) return;
    
    arr.forEach((val, idx) => {
      if (val === null || val === undefined) {
        issues.push(`❌ ${fieldName}[${idx}] é null/undefined`);
      }
      if (typeof val === 'number' && (isNaN(val) || !isFinite(val))) {
        issues.push(`❌ ${fieldName}[${idx}] é NaN ou Infinity`);
      }
    });
  };

  checkArray('consumo_mensal', data.consumo_mensal);
  checkArray('consumo_diario_mes_corrente', data.consumo_diario_mes_corrente);
  checkArray('consumo_sem_sistema_mensal', data.consumo_sem_sistema_mensal);
  checkArray('consumo_sem_sistema_diario', data.consumo_sem_sistema_diario);
  checkArray('minutos_desligado_mensal', data.minutos_desligado_mensal);
  checkArray('minutos_desligado_diario', data.minutos_desligado_diario);
  checkArray('ocupacao_mensal', data.ocupacao_mensal);
  checkArray('ocupacao_diaria', data.ocupacao_diaria);

  return issues;
};

/**
 * Valida um dispositivo completo
 */
const validateDevice = (deviceId, data) => {
  const result = {
    deviceId,
    valid: true,
    issues: [],
    warnings: []
  };

  if (!data) {
    result.valid = false;
    result.issues.push('Dados não retornados pela API');
    return result;
  }

  // Validar estrutura
  const structureIssues = validateStructure(deviceId, data);
  result.issues.push(...structureIssues);

  // Validar ranges
  const rangeIssues = validateValueRanges(deviceId, data);
  result.issues.push(...rangeIssues);

  // Validar NaN
  const nanIssues = validateNaN(deviceId, data);
  result.issues.push(...nanIssues);

  // Verificar dados vazios
  const monthlySum = (data.consumo_mensal || []).reduce((a, b) => a + Number(b), 0);
  const dailySum = (data.consumo_diario_mes_corrente || []).reduce((a, b) => a + Number(b), 0);

  if (monthlySum === 0 && dailySum === 0) {
    result.warnings.push('⚠️ Consumo zero em todos os períodos');
  }

  // Definir validade
  result.valid = result.issues.length === 0;

  return result;
};

/**
 * Valida todos os dispositivos
 */
export const validateAllDevices = async (onProgress) => {
  const results = {
    timestamp: new Date().toISOString(),
    devices: [],
    summary: {
      total: DEVICES.length,
      valid: 0,
      invalid: 0,
      warnings: 0
    }
  };

  console.log('🔍 Iniciando validação de todos os dispositivos...\n');

  for (let i = 0; i < DEVICES.length; i++) {
    const deviceId = DEVICES[i];
    const progress = Math.round(((i + 1) / DEVICES.length) * 100);

    if (onProgress) {
      onProgress({ deviceId, progress });
    }

    const data = await fetchDeviceData(deviceId);
    const validation = validateDevice(deviceId, data);

    results.devices.push(validation);

    if (validation.valid) {
      results.summary.valid++;
      console.log(`✅ Dispositivo ${deviceId}: OK`);
    } else {
      results.summary.invalid++;
      console.log(`❌ Dispositivo ${deviceId}: ERRO`);
      validation.issues.forEach(issue => console.log(`   ${issue}`));
    }

    if (validation.warnings.length > 0) {
      results.summary.warnings++;
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    console.log('');
  }

  // Resumo final
  console.log('📊 RESUMO DE VALIDAÇÃO:');
  console.log(`   Total: ${results.summary.total} dispositivos`);
  console.log(`   ✅ Válidos: ${results.summary.valid}`);
  console.log(`   ❌ Inválidos: ${results.summary.invalid}`);
  console.log(`   ⚠️ Com Avisos: ${results.summary.warnings}`);

  return results;
};

/**
 * Exporta relatório de validação para JSON
 */
export const exportValidationReport = (results) => {
  const reportText = JSON.stringify(results, null, 2);
  const blob = new Blob([reportText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `validacao-dispositivos-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
