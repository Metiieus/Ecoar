import { useState, useCallback, useEffect } from 'react';
import { loadMetaFromStorage, saveMetaToStorage, loadActivationTimeMeta, saveActivationTimeMeta } from '../lib/calculationUtils';

/**
 * Hook to manage meta values with automatic loading and saving
 */
export const useMetaStorage = (deviceId, periodFilter, selectedPeriodIndex) => {
  const [currentMeta, setCurrentMeta] = useState(10000);
  const [currentTimeMeta, setCurrentTimeMeta] = useState(periodFilter === 'daily' ? 24 : 720);
  const [loading, setLoading] = useState(true);

  // Load meta when dependencies change
  useEffect(() => {
    const loadMeta = async () => {
      setLoading(true);
      try {
        const meta = await loadMetaFromStorage(deviceId, periodFilter, selectedPeriodIndex);
        setCurrentMeta(meta);
      } catch (error) {
        console.error('Erro ao carregar meta:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMeta();
  }, [deviceId, periodFilter, selectedPeriodIndex]);

  // Load activation meta when dependencies change
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const timeMeta = await loadActivationTimeMeta(deviceId, periodFilter, selectedPeriodIndex);
        setCurrentTimeMeta(timeMeta);
      } catch (error) {
        console.error('Erro ao carregar meta de tempo:', error);
      }
    };

    loadMeta();
  }, [deviceId, periodFilter, selectedPeriodIndex]);

  // Save meta
  const saveMeta = useCallback(
    async (value) => {
      try {
        await saveMetaToStorage(deviceId, periodFilter, selectedPeriodIndex, value);
        setCurrentMeta(value);
        return true;
      } catch (error) {
        console.error('Erro ao salvar meta:', error);
        return false;
      }
    },
    [deviceId, periodFilter, selectedPeriodIndex]
  );

  // Save activation time meta
  const saveTimeMeta = useCallback(
    async (value) => {
      try {
        await saveActivationTimeMeta(deviceId, periodFilter, selectedPeriodIndex, value);
        setCurrentTimeMeta(value);
        return true;
      } catch (error) {
        console.error('Erro ao salvar meta de tempo:', error);
        return false;
      }
    },
    [deviceId, periodFilter, selectedPeriodIndex]
  );

  return {
    currentMeta,
    currentTimeMeta,
    loading,
    saveMeta,
    saveTimeMeta,
    setCurrentMeta,
    setCurrentTimeMeta
  };
};
