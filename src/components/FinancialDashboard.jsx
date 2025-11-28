import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Calendar, TrendingDown, Edit2, Check, TrendingUp, Clock, Zap, Leaf } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import GaugeChart from 'react-gauge-chart';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { deviceRankings } from '../data/mockData';
import { useApiDataContext } from '../context/ApiDataContext';
import { useMetaStorage } from '../hooks/useMetaStorage';
import {
  ensureNonNegative,
  getFilteredConsumptionData,
  calculateTotalConsumption,
  calculateTotalEconomy,
  calculateRedBars,
  calculateEconomyRate,
  getComparisonWithPreviousPeriod,
  getActivationHours,
  getLastSevenDays,
  getLastThreeMonths,
  getSelectedPeriodConsumption,
  loadActivationTimeMeta,
  saveActivationTimeMeta
} from '../lib/calculationUtils';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const FinancialDashboard = ({ selectedEstablishment, onSelectDevice }) => {
  const { apiData, loading, error, selectedDeviceId, periodFilter, setPeriodFilter, selectedPeriodIndex, setSelectedPeriodIndex } = useApiDataContext();

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [costInputValue, setCostInputValue] = useState('10000');
  const [isEditingTimeMeta, setIsEditingTimeMeta] = useState(false);
  const [timeMetaInputValue, setTimeMetaInputValue] = useState('');
  const [editingDeviceTimeId, setEditingDeviceTimeId] = useState(null);
  const [deviceTimeInputValue, setDeviceTimeInputValue] = useState('');
  const [monthMetaTablePageIndex, setMonthMetaTablePageIndex] = useState(0);
  const [allActivationMetas, setAllActivationMetas] = useState({});
  const [deviceMetas, setDeviceMetas] = useState({});

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Use hook for meta storage with instant updates
  const { currentMeta, saveMeta, currentTimeMeta, saveTimeMeta } = useMetaStorage(
    selectedDeviceId,
    periodFilter,
    selectedPeriodIndex
  );

  useEffect(() => {
    setCostInputValue(currentMeta.toString());
  }, [currentMeta]);

  useEffect(() => {
    setTimeMetaInputValue(currentTimeMeta.toString());
  }, [currentTimeMeta]);

  useEffect(() => {
    setMonthMetaTablePageIndex(0);
  }, [periodFilter]);

  // Load all activation metas for the table
  useEffect(() => {
    const loadAllMetas = async () => {
      const metas = {};
      if (periodFilter === 'daily') {
        const dailyData = apiData?.consumo_diario_mes_corrente || [];
        for (let dayIndex = 0; dayIndex < dailyData.length; dayIndex++) {
          const meta = await loadActivationTimeMeta(selectedDeviceId, 'daily', dayIndex);
          metas[`daily_${dayIndex}`] = meta;
        }
      } else {
        for (let monthIndex = 0; monthIndex <= currentMonthIndex; monthIndex++) {
          const meta = await loadActivationTimeMeta(selectedDeviceId, 'monthly', monthIndex);
          metas[`monthly_${monthIndex}`] = meta;
        }
      }
      setAllActivationMetas(metas);
    };
    loadAllMetas();
  }, [selectedDeviceId, periodFilter, currentMonthIndex, apiData]);

  // Load device metas
  useEffect(() => {
    const loadDeviceMetas = async () => {
      const metas = {};
      for (const device of deviceRankings.slice(0, 3)) {
        const meta = await loadActivationTimeMeta(device.id, periodFilter, selectedPeriodIndex);
        metas[device.id] = meta;
      }
      setDeviceMetas(metas);
    };
    loadDeviceMetas();
  }, [periodFilter, selectedPeriodIndex]);

  const handleCostInputChange = (e) => {
    setCostInputValue(e.target.value);
  };

  const handleCostKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveCostMeta();
    }
  };

  const handleSaveCostMeta = async () => {
    const newValue = parseFloat(costInputValue);
    console.log('🔧 Attempting to save meta:', {
      newValue,
      deviceId: selectedDeviceId,
      periodFilter,
      periodIndex: selectedPeriodIndex,
      isValid: !isNaN(newValue) && newValue > 0
    });

    if (!isNaN(newValue) && newValue > 0) {
      try {
        const success = await saveMeta(newValue);
        if (success) {
          setIsEditingMeta(false);
          console.log('✅ Meta saved successfully');
        } else {
          console.error('❌ Failed to save meta - database error');
          alert('Erro ao salvar meta. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('❌ Error saving meta:', error);
        alert('Erro ao salvar meta. Por favor, tente novamente.');
      }
    } else {
      console.warn('❌ Invalid value for meta:', costInputValue);
      alert('Por favor, insira um valor válido para a meta');
    }
  };

  const handleSaveDeviceTimeMeta = async (deviceId) => {
    const newValue = parseFloat(deviceTimeInputValue);
    console.log('🔧 Attempting to save device time meta:', {
      newValue,
      deviceId,
      periodFilter,
      periodIndex: selectedPeriodIndex,
      isValid: !isNaN(newValue) && newValue > 0
    });

    if (!isNaN(newValue) && newValue > 0) {
      try {
        const success = await saveActivationTimeMeta(deviceId, periodFilter, selectedPeriodIndex, newValue);
        if (success) {
          setEditingDeviceTimeId(null);
          setDeviceTimeInputValue('');
          console.log('✅ Device time meta saved successfully');
        } else {
          console.error('❌ Failed to save device time meta');
          alert('Erro ao salvar meta de tempo. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('❌ Error saving device time meta:', error);
        alert('Erro ao salvar meta de tempo. Por favor, tente novamente.');
      }
    } else {
      console.warn('❌ Invalid value for time meta:', deviceTimeInputValue);
      alert('Por favor, insira um valor válido para a meta de tempo');
    }
  };

  const handleTimeMetaInputChange = (e) => {
    setTimeMetaInputValue(e.target.value);
  };

  const handleTimeMetaKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveTimeMeta();
    }
  };

  const handleSaveTimeMeta = async () => {
    const newValue = parseFloat(timeMetaInputValue);
    console.log('🔧 Attempting to save monthly time meta:', {
      newValue,
      deviceId: selectedDeviceId,
      periodIndex: selectedPeriodIndex,
      isValid: !isNaN(newValue) && newValue > 0
    });

    if (!isNaN(newValue) && newValue > 0) {
      try {
        const success = await saveActivationTimeMeta(selectedDeviceId, 'monthly', selectedPeriodIndex, newValue);
        if (success) {
          setIsEditingTimeMeta(false);
          console.log('✅ Monthly time meta saved successfully');
        } else {
          console.error('❌ Failed to save monthly time meta');
          alert('Erro ao salvar meta mensal de tempo. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('❌ Error saving monthly time meta:', error);
        alert('Erro ao salvar meta mensal de tempo. Por favor, tente novamente.');
      }
    } else {
      console.warn('❌ Invalid value for monthly time meta:', timeMetaInputValue);
      alert('Por favor, insira um valor válido para a meta mensal de tempo');
    }
  };

  // Get filtered consumption data
  const filteredConsumptionData = useMemo(() => {
    return getFilteredConsumptionData(apiData, periodFilter, selectedPeriodIndex);
  }, [apiData, periodFilter, selectedPeriodIndex]);

  // Get red bars data (sum of both types of consumption)
  const redBarsData = useMemo(() => {
    return calculateRedBars(filteredConsumptionData);
  }, [filteredConsumptionData]);

  // Calculate total consumption (sum of all months for selected device)
  const totalConsumption = useMemo(() => {
    if (periodFilter === 'daily') {
      // For daily, sum all days in the current month
      return filteredConsumptionData.reduce((sum, item) => sum + item.consumo, 0);
    }
    // For monthly, sum ALL months
    return filteredConsumptionData.reduce((sum, item) => sum + item.consumo, 0);
  }, [filteredConsumptionData, periodFilter]);

  // Calculate selected period consumption (only current selected month/day)
  const selectedPeriodConsumption = useMemo(() => {
    if (periodFilter === 'daily') {
      // For daily, sum all days (same as total)
      return filteredConsumptionData.reduce((sum, item) => sum + item.consumo, 0);
    }
    // For monthly, use only the selected month
    return filteredConsumptionData[selectedPeriodIndex]?.consumo || 0;
  }, [filteredConsumptionData, periodFilter, selectedPeriodIndex]);

  // Calculate total economy (for selected period)
  // Economy = sum of consumo_sem_sistema
  const totalEconomy = useMemo(() => {
    if (!Array.isArray(filteredConsumptionData) || filteredConsumptionData.length === 0) return 0;

    if (periodFilter === 'daily') {
      // For daily, sum all consumoSemSistema in the current month
      return filteredConsumptionData.reduce((sum, item) => sum + (item.consumoSemSistema || 0), 0);
    }

    // For monthly, sum ALL months of consumo_sem_sistema_mensal
    return filteredConsumptionData.reduce((sum, item) => sum + (item.consumoSemSistema || 0), 0);
  }, [filteredConsumptionData, periodFilter]);

  // Calculate economy rate
  const economyRate = useMemo(() => {
    return calculateEconomyRate(totalEconomy, totalConsumption);
  }, [totalEconomy, totalConsumption]);

  // Get comparison with previous period
  const previousPeriodComparison = useMemo(() => {
    return getComparisonWithPreviousPeriod(filteredConsumptionData, periodFilter, selectedPeriodIndex);
  }, [filteredConsumptionData, periodFilter, selectedPeriodIndex]);

  // Get monthly data for reduction comparison (always use monthly data regardless of current filter)
  const monthlyData = useMemo(() => {
    if (!apiData || !Array.isArray(apiData.consumo_mensal)) return [];
    return apiData.consumo_mensal.map((consumo, index) => {
      const consumoVal = ensureNonNegative(consumo);
      const consumoSemSistemaApi = apiData.consumo_sem_sistema_mensal?.[index];

      let consumoSemSistemaVal;
      if (consumoVal === 0) {
        consumoSemSistemaVal = 0;
      } else if (consumoSemSistemaApi !== undefined && consumoSemSistemaApi !== null && consumoSemSistemaApi !== 0) {
        consumoSemSistemaVal = ensureNonNegative(consumoSemSistemaApi);
      } else if (consumoSemSistemaApi === 0) {
        consumoSemSistemaVal = 0;
      } else {
        consumoSemSistemaVal = ensureNonNegative(consumoVal / 0.8);
      }

      return {
        period: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index],
        index,
        consumo: consumoVal,
        consumoSemSistema: consumoSemSistemaVal
      };
    });
  }, [apiData]);

  // Get monthly reduction (always compares current month with previous month)
  const monthlyReduction = useMemo(() => {
    return getComparisonWithPreviousPeriod(monthlyData, 'monthly', currentMonthIndex);
  }, [monthlyData, currentMonthIndex]);

  // Get activation hours
  const activationHours = useMemo(() => {
    return getActivationHours(apiData, periodFilter, selectedPeriodIndex);
  }, [apiData, periodFilter, selectedPeriodIndex]);

  // Chart data for monthly/daily visualization
  const chartData = useMemo(() => {
    if (periodFilter === 'monthly') {
      return filteredConsumptionData;
    }
    return getLastSevenDays(filteredConsumptionData);
  }, [filteredConsumptionData, periodFilter]);

  // Get current period data
  const currentPeriodData = useMemo(() => {
    if (filteredConsumptionData.length === 0) return null;
    return filteredConsumptionData[selectedPeriodIndex] || filteredConsumptionData[0];
  }, [filteredConsumptionData, selectedPeriodIndex]);

  // Economic pie data
  const economyPieData = useMemo(() => {
    const consumoWithoutSystem = currentPeriodData?.consumo || 0;
    const consumoWithSystem = currentPeriodData?.consumoSemSistema || 0;

    return [
      { name: 'Consumo com Sistema', value: Math.max(consumoWithSystem, 1), fill: '#10b981' },
      { name: 'Consumo sem Sistema', value: Math.max(consumoWithoutSystem, 1), fill: '#dc2626' }
    ];
  }, [currentPeriodData]);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriodFilter(newPeriod);
  };

  const handlePeriodIndexChange = (newIndex) => {
    setSelectedPeriodIndex(newIndex);
  };

  // ECharts options
  const getMonthlyChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937' },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          let html = `<div style="padding: 8px; font-weight: 600; color: #1f2937;">${params[0].name}</div>`;
          params.forEach((param) => {
            const color = param.color;
            html += `<div style="color: #4b5563; font-size: 12px; margin-top: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              ${param.seriesName}: <span style="font-weight: 600;">R$ ${param.value.toLocaleString('pt-BR')}</span>
            </div>`;
          });
          return html;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(d => d.period),
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6' } }
      },
      legend: {
        data: ['Consumo Mensal', 'Mensal + sem Sistema', 'Meta'],
        top: 0,
        textStyle: { color: '#6b7280', fontSize: 12 }
      },
      series: [
        {
          name: 'Consumo Mensal',
          data: chartData.map(d => ensureNonNegative(d.consumo)),
          type: 'bar',
          itemStyle: { color: '#10b981', borderRadius: [8, 8, 0, 0], shadowColor: 'rgba(16, 185, 129, 0.3)', shadowBlur: 4, shadowOffsetY: 2 },
          emphasis: { itemStyle: { color: '#059669', shadowBlur: 8 } }
        },
        {
          name: 'Mensal + sem Sistema',
          data: chartData.map(d => {
            // If consumoSemSistema is 0, show 0; otherwise show sum
            if (d.consumoSemSistema === 0) {
              return 0;
            }
            return ensureNonNegative(d.consumo + d.consumoSemSistema);
          }),
          type: 'bar',
          itemStyle: { color: '#ef4444', borderRadius: [8, 8, 0, 0], shadowColor: 'rgba(239, 68, 68, 0.3)', shadowBlur: 4, shadowOffsetY: 2 },
          emphasis: { itemStyle: { color: '#dc2626', shadowBlur: 8 } }
        },
        {
          name: 'Meta',
          data: chartData.map(() => ensureNonNegative(currentMeta)),
          type: 'line',
          smooth: false,
          lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
          symbolSize: 4,
          emphasis: { itemStyle: { borderWidth: 2 } }
        }
      ]
    };
  };

  const getDailyChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937' }
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(d => d.period),
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6' } }
      },
      legend: {
        data: ['Consumo Diário', 'Diário + sem Sistema', 'Meta'],
        top: 0,
        textStyle: { color: '#6b7280', fontSize: 12 }
      },
      series: [
        {
          name: 'Consumo Diário',
          data: chartData.map(d => ensureNonNegative(d.consumo)),
          type: 'bar',
          itemStyle: { color: '#10b981' },
          emphasis: { itemStyle: { borderWidth: 2 } }
        },
        {
          name: 'Diário + sem Sistema',
          data: chartData.map(d => {
            // If consumoSemSistema is 0, show 0; otherwise show sum
            if (d.consumoSemSistema === 0) {
              return 0;
            }
            return ensureNonNegative(d.consumo + d.consumoSemSistema);
          }),
          type: 'bar',
          itemStyle: { color: '#ef4444' },
          emphasis: { itemStyle: { borderWidth: 2 } }
        },
        {
          name: 'Meta',
          data: chartData.map(() => ensureNonNegative(currentMeta)),
          type: 'line',
          smooth: false,
          lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
          symbolSize: 4,
          emphasis: { itemStyle: { borderWidth: 2 } }
        }
      ]
    };
  };

  const getPieChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937' },
        formatter: '{b}: R$ {c}'
      },
      series: [
        {
          name: 'Economia',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: economyPieData,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}\nR$ {c}',
            color: '#1f2937',
            fontSize: 11
          }
        }
      ]
    };
  };

  const allMonthsData = useMemo(() => {
    if (periodFilter === 'daily') {
      const dailyData = apiData?.consumo_diario_mes_corrente || [];
      return dailyData.map((_, dayIndex) => {
        const meta = allActivationMetas[`daily_${dayIndex}`] || 24;
        const downtimeMinutes = apiData?.minutos_desligado_diario?.[dayIndex] || 0;
        const actualHours = downtimeMinutes / 60;

        return {
          month: `D${dayIndex + 1}`,
          value: `${meta.toFixed(0)} h`,
          atualização: `${actualHours.toFixed(1)} H`
        };
      });
    }

    return monthNames.slice(0, currentMonthIndex + 1).map((name, monthIndex) => {
      const meta = allActivationMetas[`monthly_${monthIndex}`] || 720;
      const downtimeMinutes = apiData?.minutos_desligado_mensal?.[monthIndex] || 0;
      const actualHours = downtimeMinutes / 60;

      return {
        month: name.toUpperCase(),
        value: `${meta.toFixed(0)} h`,
        atualização: `${actualHours.toFixed(1)} H`
      };
    });
  }, [apiData, periodFilter, currentMonthIndex, allActivationMetas]);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(allMonthsData.length / itemsPerPage);
  const paginatedMonthsData = allMonthsData.slice(
    monthMetaTablePageIndex * itemsPerPage,
    (monthMetaTablePageIndex + 1) * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 text-amber-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Aviso: Dados Mock</p>
            <p className="text-xs text-amber-700 mt-1">Não foi possível conectar à API. Exibindo dados de demonstra��ão. {error}</p>
          </div>
        </div>
      )}
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Left Sidebar with 4 Cards */}
        <div className="space-y-3 lg:col-span-1">
          <div className={`rounded-lg p-4 shadow-md border transition-all h-fit ${
            isEditingMeta
              ? 'bg-[#F0EAD2] border-[#D4CFC0] border-2'
              : 'bg-white border-[#E8DCC8] hover:shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-bold text-[#6B7560] uppercase tracking-wide">
                  {periodFilter === 'daily' ? 'Meta Diária' : 'Meta Mensal'}
                </p>
                <p className="text-xs text-[#A3B18A]">
                  {periodFilter === 'daily' ? `Dia ${selectedPeriodIndex + 1}` : monthNames[selectedPeriodIndex]}
                </p>
              </div>
              <TrendingDown className="w-4 h-4 text-[#1F4532]" />
            </div>
            {isEditingMeta ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  type="number"
                  value={costInputValue}
                  onChange={handleCostInputChange}
                  onKeyPress={handleCostKeyPress}
                  placeholder="0"
                  className="w-full px-3 py-2 border-2 border-[#A3B18A] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4532]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCostMeta}
                    className="flex-1 px-3 py-2 bg-[#1F4532] hover:bg-[#2D5740] text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingMeta(false);
                      setCostInputValue(currentMeta.toString());
                    }}
                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-[#1F4532] rounded text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">R${ensureNonNegative(currentMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <button
                  onClick={() => {
                    console.log('📝 Iniciando edição de meta, valor atual:', currentMeta);
                    setCostInputValue(currentMeta.toString());
                    setIsEditingMeta(true);
                  }}
                  className="w-full px-3 py-2 bg-[#E8DCC8] hover:bg-[#E8DCC8] text-[#1F4532] rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Meta
                </button>
              </div>
            )}
          </div>

          {/* Redução Card */}
          <div className={`bg-gradient-to-br rounded-lg p-5 shadow-md border text-white flex flex-col justify-center hover:shadow-lg transition-shadow h-fit ${
            previousPeriodComparison.percentChange >= 0
              ? 'border-[#10b981]/20'
              : 'from-red-500 to-red-600 border-red-700/20'
          }`}
          style={previousPeriodComparison.percentChange >= 0 ? { background: '#10b981' } : undefined}>
            <p className="text-3xl font-bold mb-1 text-center">{Math.abs(previousPeriodComparison.percentChange).toFixed(1)}%</p>
            <p className="text-xs font-semibold text-center leading-tight">
              {previousPeriodComparison.percentChange >= 0 ? '↓ Redução' : '↑ Aumento'} vs {periodFilter === 'daily' ? 'Dia anterior' : 'Mês anterior'}
            </p>
          </div>

          {/* Ocupação Card */}
          <div className="bg-gradient-to-br from-[#1F4532] to-[#2D5740] rounded-lg p-4 shadow-md border border-[#1F4532]/20 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#F0EAD2] uppercase tracking-wide">
                {periodFilter === 'daily' ? 'Ocupação Diária' : 'Ocupação Mensal'}
              </p>
              <Zap className="w-4 h-4 text-[#A3B18A]" />
            </div>
            <p className="text-2xl font-bold text-[#F0EAD2] mb-2">
              {periodFilter === 'daily'
                ? apiData?.ocupacao_diaria ? apiData.ocupacao_diaria[selectedPeriodIndex]?.toFixed(1) || 0 : 0
                : apiData?.ocupacao_mensal ? apiData.ocupacao_mensal[selectedPeriodIndex]?.toFixed(1) || 0 : 0}%
            </p>
            <p className="text-xs text-[#D4CFC0]">
              {periodFilter === 'monthly' ? monthNames[selectedPeriodIndex] : `Dia ${selectedPeriodIndex + 1}`}
            </p>
          </div>
        </div>

        {/* Economia Total - Gauge Chart */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-[#E8DCC8] hover:shadow-lg transition-shadow col-span-1 lg:col-span-2 flex flex-col h-auto lg:h-96">
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Economia {periodFilter === 'daily' ? 'Diária' : 'Total'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Percentual de Economia Alcançada</p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 overflow-hidden">
            <div className="flex-shrink-0 w-48 h-48 sm:w-72 sm:h-72 flex items-center justify-center">
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GaugeChart
                  id="economia-gauge"
                  nrOfLevels={5}
                  colors={['#d1fae5', '#6ee7b7', '#10b981', '#047857', '#065f46']}
                  arcPadding={0.1}
                  percent={Math.min(economyRate / 100, 1)}
                  textColor="#1f2937"
                  needleColor="#1f2937"
                  needleBaseColor="#1f2937"
                  arcWidth={0.3}
                  hideText={false}
                />
              </div>
            </div>
            <div className="space-y-6 flex-shrink-0">
              <div>
                <p className="text-xs text-[#6B7560] font-semibold mb-2">Consumo Total</p>
                <p className="text-3xl font-bold text-gray-900">R$ {(ensureNonNegative(totalConsumption) / 1000).toFixed(1)}k</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7560] font-semibold mb-2">Economia Alcançada</p>
                <p className="text-3xl font-bold text-[#1F4532]">R$ {(ensureNonNegative(totalEconomy) / 1000).toFixed(1)}k</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7560] font-semibold mb-2">Taxa de Economia</p>
                <p className="text-2xl font-bold text-[#A3B18A]">{economyRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Período Selecionado and Redução Mensal */}
        <div className="flex flex-col gap-4 col-span-1 lg:col-span-2">
          {/* Período Selecionado Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 shadow-md border border-blue-200 hover:shadow-lg transition-shadow h-fit">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                {periodFilter === 'daily' ? `Dia ${selectedPeriodIndex + 1}` : monthNames[selectedPeriodIndex]}
              </p>
              {periodFilter === 'daily' ? (
                <input
                  type="range"
                  min="0"
                  max={filteredConsumptionData.length - 1}
                  value={selectedPeriodIndex}
                  onChange={(e) => handlePeriodIndexChange(parseInt(e.target.value))}
                  className="w-20"
                />
              ) : (
                <select
                  value={selectedPeriodIndex}
                  onChange={(e) => handlePeriodIndexChange(parseInt(e.target.value))}
                  className="text-xs px-2 py-1 border border-blue-300 rounded bg-white text-[#1F4532] hover:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={String(index)}>{name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="mb-3 space-y-2">
              <div>
                <p className="text-xs text-[#6B7560] mb-1">Consumo sem Sistema</p>
                <p className="text-2xl font-bold text-gray-900">
                  R${ensureNonNegative(currentPeriodData?.consumo || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="border-t border-blue-200 pt-2">
                <p className="text-xs text-[#6B7560] mb-1">Consumo com Sistema</p>
                <p className="text-lg font-bold text-blue-600">
                  R${ensureNonNegative(currentPeriodData?.consumoSemSistema || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="bg-blue-50/50 rounded p-2 space-y-1">
              <p className="text-xs text-[#6B7560]">Meta: <span className="font-semibold text-gray-900">R${ensureNonNegative(currentMeta).toLocaleString('pt-BR')}</span></p>
              <p className="text-xs text-[#6B7560]">
                Economia: <span className="font-semibold text-[#1F4532]">
                  R${ensureNonNegative((currentPeriodData?.consumo || 0) - (currentPeriodData?.consumoSemSistema || 0)).toLocaleString('pt-BR')}
                </span>
              </p>
            </div>
          </div>

          {/* Redução Mensal Card */}
          {(periodFilter === 'monthly' || periodFilter === 'daily') && (
            <div className={`bg-gradient-to-br rounded-lg p-5 shadow-md border text-white flex flex-col justify-center hover:shadow-lg transition-shadow h-fit ${
              monthlyReduction.percentChange >= 0
                ? 'border-[#10b981]/20'
                : 'from-red-500 to-red-600 border-red-700/20'
            }`}
            style={monthlyReduction.percentChange >= 0 ? { background: '#10b981' } : undefined}>
              <p className="text-3xl font-bold mb-1 text-center">{Math.abs(monthlyReduction.percentChange).toFixed(1)}%</p>
              <p className="text-xs font-semibold text-center leading-tight">
                {monthlyReduction.percentChange >= 0 ? '↓ Redução' : '↑ Aumento'} Mensal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info and Filter Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-md border border-[#E8DCC8]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-[#6B7560]">E</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1F4532]">Unidade {selectedEstablishment}</p>
            <p className="text-xs text-gray-500">Reais (R$)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Período:</span>
          <div className="flex items-center gap-1">
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePeriodChange('monthly')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    periodFilter === 'monthly'
                      ? 'bg-[#1F4532] text-white'
                      : 'bg-[#E8DCC8] text-[#1F4532] hover:bg-[#E8DCC8]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Mensal</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Visualizar dados por mês</TooltipContent>
            </UITooltip>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePeriodChange('daily')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    periodFilter === 'daily'
                      ? 'bg-[#1F4532] text-white'
                      : 'bg-[#E8DCC8] text-[#1F4532] hover:bg-[#E8DCC8]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Diário</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Visualizar dados por dia</TooltipContent>
            </UITooltip>
          </div>
        </div>
      </div>

      {/* Main Content - Graph and Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Large Graph Section */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-lg p-6 shadow-md border border-[#E8DCC8] hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Gráfico {periodFilter === 'monthly' ? 'Mensal' : 'Diário'}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {periodFilter === 'monthly' ? 'Consumo para o Ano Atual' : 'Consumo para o Mês Atual'}
          </p>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto mb-3"></div>
                <p className="text-xs text-[#6B7560]">Carregando dados da API...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-red-600 mb-2">Erro ao carregar dados</p>
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div style={{ width: '100%', height: '350px' }}>
              <ReactECharts
                option={periodFilter === 'monthly' ? getMonthlyChartOption() : getDailyChartOption()}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-3">
          {/* Status Card */}
          <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#1F4532] uppercase">Status</p>
              <Leaf className="w-4 h-4 text-[#1F4532]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${totalConsumption <= currentMeta ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <p className={`text-xs font-semibold ${totalConsumption <= currentMeta ? 'text-[#1F4532]' : 'text-red-600'}`}>
                  {totalConsumption <= currentMeta ? '✓ Dentro da meta' : '✗ Acima da meta'}
                </p>
              </div>
            </div>
          </div>

          {/* Update Table */}
          <div className="bg-white rounded-lg p-3 shadow-md border border-[#E8DCC8] hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#1F4532] uppercase">{periodFilter === 'daily' ? 'Dia / Metas / Atualiz.' : 'Mês / Metas / Atualiz.'}</p>
              <span className="text-xs text-gray-500">{monthMetaTablePageIndex + 1} / {totalPages}</span>
            </div>
            <div className="space-y-1">
              {paginatedMonthsData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs border-b border-[#D4CFC0] pb-1 last:border-b-0 hover:bg-[#F0EAD2] px-1 py-0.5 rounded transition-colors">
                  <span className="font-bold text-[#1F4532] min-w-10">{item.month}</span>
                  <span className="text-[#A3B18A] flex-1 text-center font-medium text-xs">{item.value}</span>
                  <span className="font-bold text-gray-900 text-right w-10 text-xs">{item.atualização}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#E8DCC8]">
              <button
                onClick={() => setMonthMetaTablePageIndex(Math.max(0, monthMetaTablePageIndex - 1))}
                disabled={monthMetaTablePageIndex === 0}
                className="flex-1 px-2 py-1.5 bg-[#E8DCC8] hover:bg-[#E8DCC8] disabled:bg-[#F0EAD2] disabled:text-gray-400 text-[#1F4532] rounded text-xs font-medium transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setMonthMetaTablePageIndex(Math.min(totalPages - 1, monthMetaTablePageIndex + 1))}
                disabled={monthMetaTablePageIndex >= totalPages - 1}
                className="flex-1 px-2 py-1.5 bg-[#E8DCC8] hover:bg-[#E8DCC8] disabled:bg-[#F0EAD2] disabled:text-gray-400 text-[#1F4532] rounded text-xs font-medium transition-colors"
              >
                Próximo →
              </button>
            </div>
          </div>

          {/* Activation Time */}
          <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8] hover:shadow-lg transition-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#A3B18A]" />
                <p className="text-xs font-bold text-[#1F4532] uppercase">Tempo de Atuação</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#6B7560] font-semibold">
                {periodFilter === 'daily' ? 'Atuação Hoje (h)' : 'Meta Mensal (h)'}
              </p>
              {periodFilter === 'monthly' ? (
                isEditingTimeMeta ? (
                  <div className="flex gap-2 items-center">
                    <input
                      autoFocus
                      type="number"
                      value={timeMetaInputValue}
                      onChange={handleTimeMetaInputChange}
                      onKeyPress={handleTimeMetaKeyPress}
                      placeholder="0"
                      className="flex-1 px-2 py-1 border-2 border-[#A3B18A] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4532]"
                    />
                    <button
                      onClick={handleSaveTimeMeta}
                      className="px-2 py-1 bg-[#F0EAD2]0 hover:bg-[#1F4532] text-white rounded text-xs font-medium transition-colors"
                      title="Salvar"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[#A3B18A]">{currentTimeMeta.toFixed(1)}h</p>
                    <button
                      onClick={() => {
                        console.log('📝 Iniciando edição de meta de tempo no card, valor atual:', currentTimeMeta);
                        setTimeMetaInputValue(currentTimeMeta.toString());
                        setIsEditingTimeMeta(true);
                      }}
                      className="px-1.5 py-0.5 bg-[#E8DCC8] hover:bg-[#D4CFC0] text-[#1F4532] rounded text-xs font-medium transition-colors"
                      title="Editar meta"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              ) : (
                <p className="text-lg font-bold text-[#A3B18A]">{activationHours.toFixed(1)}h</p>
              )}
            </div>
            <div className="space-y-2 border-t border-[#E8DCC8] pt-3">
              <p className="text-xs text-[#6B7560] font-semibold mb-2">Dispositivos Ativos</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {deviceRankings.slice(0, 3).map((device) => {
                  const deviceTimeMeta = deviceMetas[device.id] || (periodFilter === 'daily' ? 24 : 720);
                  const isEditing = editingDeviceTimeId === device.id;

                  return (
                    <div
                      key={device.id}
                      className="flex items-center gap-2 text-xs bg-[#F0EAD2] p-2 rounded hover:bg-[#F0EAD2] cursor-pointer transition-colors"
                    >
                      <span className="text-base">{device.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-[#1F4532]">{device.name}</p>
                        {isEditing ? (
                          <div className="flex gap-1 mt-0.5">
                            <input
                              autoFocus
                              type="number"
                              value={deviceTimeInputValue}
                              onChange={(e) => setDeviceTimeInputValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveDeviceTimeMeta(device.id);
                                }
                              }}
                              placeholder="0"
                              className="w-10 px-1 py-0.5 border border-[#D4CFC0] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#1F4532]"
                            />
                            <button
                              onClick={() => handleSaveDeviceTimeMeta(device.id)}
                              className="px-1.5 py-0.5 bg-[#F0EAD2]0 hover:bg-[#1F4532] text-white rounded text-xs font-medium transition-colors"
                              title="Salvar"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="text-gray-500">{deviceTimeMeta.toFixed(1)}h - Score: {device.score}</p>
                            <button
                              onClick={() => {
                                setEditingDeviceTimeId(device.id);
                                setDeviceTimeInputValue(deviceTimeMeta.toString());
                              }}
                              className="px-1 py-0.5 bg-[#E8DCC8] hover:bg-[#D4CFC0] text-[#1F4532] rounded text-xs font-medium transition-colors"
                              title="Editar meta"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FinancialDashboard);
