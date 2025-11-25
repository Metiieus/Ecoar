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
        console.log(`📖 Loading meta for device ${deviceId}, ${periodFilter}, index ${selectedPeriodIndex}`);
        const meta = await loadMetaFromStorage(deviceId, periodFilter, selectedPeriodIndex);
        console.log(`📖 Meta loaded: ${meta}`);
        setCurrentMeta(meta);
      } catch (error) {
        console.error('Error loading meta:', error);
        setCurrentMeta(10000);
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
        console.log(`📖 Loading activation meta for device ${deviceId}, ${periodFilter}, index ${selectedPeriodIndex}`);
        const timeMeta = await loadActivationTimeMeta(deviceId, periodFilter, selectedPeriodIndex);
        console.log(`📖 Activation meta loaded: ${timeMeta}h`);
        setCurrentTimeMeta(timeMeta);
      } catch (error) {
        console.error('Error loading activation meta:', error);
        setCurrentTimeMeta(periodFilter === 'daily' ? 24 : 720);
      }
    };

    loadMeta();
  }, [deviceId, periodFilter, selectedPeriodIndex]);

  // Save meta
  const saveMeta = useCallback(
    async (value) => {
      try {
        console.log(`💾 Saving meta: device ${deviceId}, ${periodFilter}, index ${selectedPeriodIndex}, value ${value}`);
        await saveMetaToStorage(deviceId, periodFilter, selectedPeriodIndex, value);
        setCurrentMeta(value);
        console.log(`✅ Meta save callback completed`);
        return true;
      } catch (error) {
        console.error('Error saving meta:', error);
        return false;
      }
    },
    [deviceId, periodFilter, selectedPeriodIndex]
  );

  // Save activation time meta
  const saveTimeMeta = useCallback(
    async (value) => {
      try {
        console.log(`💾 Saving activation meta: device ${deviceId}, ${periodFilter}, index ${selectedPeriodIndex}, value ${value}h`);
        await saveActivationTimeMeta(deviceId, periodFilter, selectedPeriodIndex, value);
        setCurrentTimeMeta(value);
        console.log(`✅ Activation meta save callback completed`);
        return true;
      } catch (error) {
        console.error('Error saving activation meta:', error);
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
