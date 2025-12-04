import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://tb8calt97j.execute-api.sa-east-1.amazonaws.com/dev/dados'
  : '/api/dados';

const defaultApiData = {
  meta_consumo_mensal: [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500],
  meta_consumo_diaria: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
  meta_tempo_atuacao_mensal: [720, 720, 720, 720, 720, 720, 720, 720, 720, 720, 720, 720],
  meta_tempo_atuacao_diaria: [24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24],
  consumo_mensal: [0.0, 0.0, 563.28, 1805.39, 2453.32, 2687.39, 2208.17, 2169.09, 1740.71, 1999.26, 1085.54, 0.0],
  consumo_diario_mes_corrente: [52.85, 49.92, 49.06, 53.5, 64.72, 60.86, 55.28, 58.17, 23.12, 0.0, 0.0, 41.38, 60.51, 54.7, 50.44, 50.61, 53.77, 53.49, 48.38, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  consumo_sem_sistema_mensal: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 286.27, 1053.23, 835.49, 734.35, 0.0],
  consumo_sem_sistema_diario: [39.01, 38.6, 39.63, 38.18, 39.22, 39.22, 39.63, 42.1, 40.04, 39.01, 39.42, 39.63, 38.8, 39.42, 40.04, 39.22, 39.42, 35.71, 28.07, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  potencias: [],
  minutos_desligado_diario: [189, 187, 192, 185, 190, 190, 192, 204, 194, 189, 191, 192, 188, 191, 194, 190, 191, 173, 136, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  minutos_desligado_mensal: [0, 0, 0, 0, 0, 0, 0, 1387, 5103, 4048, 3558, 0],
  ocupacao_mensal: [0.0, 0.0, 65.5, 72.3, 78.9, 82.1, 75.4, 71.6, 68.2, 74.5, 58.3, 0.0],
  ocupacao_diaria: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
};

export const useApiData = (deviceId = 33, includeHistory = true) => {
  const [data, setData] = useState(defaultApiData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let urlString;
        try {
          if (import.meta.env.PROD) {
            const url = new URL(API_BASE_URL);
            url.searchParams.append('device_id', deviceId);
            url.searchParams.append('historico', includeHistory);
            urlString = url.toString();
          } else {
            const baseUrl = `${window.location.origin}${API_BASE_URL}`;
            const url = new URL(baseUrl);
            url.searchParams.append('device_id', deviceId);
            url.searchParams.append('historico', includeHistory);
            urlString = url.toString();
          }
        } catch (urlErr) {
          console.warn('Erro ao construir URL:', urlErr.message);
          throw new Error(`URL inválida: ${urlErr.message}`);
        }

        const response = await fetch(urlString, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const apiData = await response.json();

        // Validate API data structure
        const requiredArrays = [
          'consumo_mensal',
          'consumo_diario_mes_corrente',
          'consumo_sem_sistema_mensal',
          'consumo_sem_sistema_diario',
          'minutos_desligado_mensal',
          'minutos_desligado_diario'
        ];

        let dataIsValid = true;
        for (const arrayName of requiredArrays) {
          if (!Array.isArray(apiData[arrayName])) {
            console.warn(`Device ${deviceId}: Missing or invalid array ${arrayName}`);
            dataIsValid = false;
          }
        }

        if (dataIsValid) {
          console.log(`✅ Device ${deviceId}: All required data arrays present`);
        } else {
          console.warn(`⚠️ Device ${deviceId}: Some data arrays are missing or invalid`);
        }

        // Enrich API data with calculated fields for consumption without system
        // Prefer API-provided "consumo_sem_sistema" arrays when they contain meaningful values.
        // Otherwise, derive them from consumo_mensal / consumo_diario_mes_corrente without rounding
        // If API returns the field (even if zeros), use it as-is. Only fallback if field is missing entirely.
        const hasApiMonthlyWithout = Array.isArray(apiData.consumo_sem_sistema_mensal) && apiData.consumo_sem_sistema_mensal.length > 0;
        const hasApiDailyWithout = Array.isArray(apiData.consumo_sem_sistema_diario) && apiData.consumo_sem_sistema_diario.length > 0;
        const hasApiOcupacaoMensal = Array.isArray(apiData.ocupacao_mensal) && apiData.ocupacao_mensal.length > 0;
        const hasApiOcupacaoDiaria = Array.isArray(apiData.ocupacao_diaria) && apiData.ocupacao_diaria.length > 0;
        const hasApiMetaTempoMensal = Array.isArray(apiData.meta_tempo_atuacao_mensal) && apiData.meta_tempo_atuacao_mensal.length > 0;
        const hasApiMetaTempoDiaria = Array.isArray(apiData.meta_tempo_atuacao_diaria) && apiData.meta_tempo_atuacao_diaria.length > 0;

        const enrichedData = {
          ...apiData,
          meta_consumo_mensal: Array.isArray(apiData.meta_consumo_mensal)
            ? apiData.meta_consumo_mensal.map(v => Number(v))
            : [],
          meta_consumo_diaria: Array.isArray(apiData.meta_consumo_diaria)
            ? apiData.meta_consumo_diaria.map(v => Number(v))
            : [],
          meta_tempo_atuacao_mensal: hasApiMetaTempoMensal
            ? apiData.meta_tempo_atuacao_mensal.map(v => Math.max(0, Number(v)))
            : defaultApiData.meta_tempo_atuacao_mensal,
          meta_tempo_atuacao_diaria: hasApiMetaTempoDiaria
            ? apiData.meta_tempo_atuacao_diaria.map(v => Math.max(0, Number(v)))
            : defaultApiData.meta_tempo_atuacao_diaria,
          consumo_sem_sistema_mensal: hasApiMonthlyWithout
            ? apiData.consumo_sem_sistema_mensal.map(v => Math.max(0, Number(v)))
            : (apiData.consumo_mensal?.length > 0 ? apiData.consumo_mensal.map(consumo => Math.max(0, (Number(consumo) || 0) / 0.8)) : []),
          consumo_sem_sistema_diario: hasApiDailyWithout
            ? apiData.consumo_sem_sistema_diario.map(v => Math.max(0, Number(v)))
            : (apiData.consumo_diario_mes_corrente?.length > 0 ? apiData.consumo_diario_mes_corrente.map(consumo => Math.max(0, (Number(consumo) || 0) / 0.8)) : []),
          ocupacao_mensal: hasApiOcupacaoMensal
            ? apiData.ocupacao_mensal.map(v => Math.max(0, Number(v)))
            : defaultApiData.ocupacao_mensal,
          ocupacao_diaria: hasApiOcupacaoDiaria
            ? apiData.ocupacao_diaria.map(v => Math.max(0, Number(v)))
            : defaultApiData.ocupacao_diaria
        };

        setData(enrichedData);
        console.log(`📊 Device ${deviceId} enriched API data loaded:`, {
          monthlyPoints: enrichedData.consumo_mensal?.length || 0,
          dailyPoints: enrichedData.consumo_diario_mes_corrente?.length || 0,
          hasApiMonthlyWithout,
          hasApiDailyWithout,
          metaTempoMensal: enrichedData.meta_tempo_atuacao_mensal,
          metaTempoDiaria: enrichedData.meta_tempo_atuacao_diaria?.slice(0, 5)
        });
      } catch (err) {
        console.warn('Erro ao buscar dados da API:', err.message);
        console.warn('URL tentada:', urlString);
        setError(`Erro ao conectar com a API: ${err.message}`);
        // Use mock data como fallback
        setData(defaultApiData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, includeHistory]);

  return { data, loading, error };
};
