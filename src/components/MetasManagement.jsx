import { useState, useEffect, useMemo } from 'react';
import { Clock, Edit2, Check, X, Save } from 'lucide-react';
import { useApiDataContext } from '../context/ApiDataContext';
import { loadActivationTimeMeta, saveActivationTimeMeta } from '../lib/calculationUtils';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MetasManagement = () => {
  const { apiData, selectedDeviceId } = useApiDataContext();
  const [activeTab, setActiveTab] = useState('monthly');
  const [monthlyMetas, setMonthlyMetas] = useState([]);
  const [dailyMetas, setDailyMetas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  const currentMonthIndex = new Date().getMonth();

  // Load all metas on component mount and when device/API data changes
  useEffect(() => {
    const loadAllMetas = async () => {
      setLoading(true);
      try {
        // Load monthly metas
        const monthlyData = [];
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const meta = await loadActivationTimeMeta(selectedDeviceId, 'monthly', monthIndex, apiData);
          const apiDefault = apiData?.meta_tempo_atuacao_mensal?.[monthIndex] ?? 720;
          monthlyData.push({
            id: `monthly_${monthIndex}`,
            type: 'monthly',
            index: monthIndex,
            name: monthNames[monthIndex],
            value: meta,
            apiDefault,
            isDefault: meta === apiDefault
          });
        }
        setMonthlyMetas(monthlyData);

        // Load daily metas for current month
        const dailyCount = apiData?.consumo_diario_mes_corrente?.length || 30;
        const dailyData = [];
        for (let dayIndex = 0; dayIndex < dailyCount; dayIndex++) {
          const meta = await loadActivationTimeMeta(selectedDeviceId, 'daily', dayIndex, apiData);
          const apiDefault = apiData?.meta_tempo_atuacao_diaria?.[dayIndex] ?? 24;
          dailyData.push({
            id: `daily_${dayIndex}`,
            type: 'daily',
            index: dayIndex,
            name: `Dia ${dayIndex + 1}`,
            value: meta,
            apiDefault,
            isDefault: meta === apiDefault
          });
        }
        setDailyMetas(dailyData);

        setLoading(false);
      } catch (error) {
        console.error('Error loading metas:', error);
        setLoading(false);
      }
    };

    loadAllMetas();
  }, [selectedDeviceId, apiData]);

  const handleStartEdit = (id, currentValue) => {
    setEditingId(id);
    setEditingValue(currentValue.toString());
  };

  const handleSave = async (meta) => {
    const newValue = parseFloat(editingValue);

    if (isNaN(newValue) || newValue < 0) {
      alert('Por favor, insira um valor válido (≥ 0)');
      return;
    }

    setSaveStatus('saving');

    try {
      const success = await saveActivationTimeMeta(selectedDeviceId, meta.type, meta.index, newValue);

      if (success) {
        setSaveStatus('success');
        
        // Update local state
        if (meta.type === 'monthly') {
          setMonthlyMetas(prev =>
            prev.map(m =>
              m.id === meta.id
                ? { ...m, value: newValue, isDefault: newValue === m.apiDefault }
                : m
            )
          );
        } else {
          setDailyMetas(prev =>
            prev.map(m =>
              m.id === meta.id
                ? { ...m, value: newValue, isDefault: newValue === m.apiDefault }
                : m
            )
          );
        }

        setEditingId(null);
        setEditingValue('');

        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
        alert('Erro ao salvar meta. Por favor, tente novamente.');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (error) {
      console.error('Error saving meta:', error);
      setSaveStatus('error');
      alert('Erro ao salvar meta. Por favor, tente novamente.');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const statsMonthly = useMemo(() => {
    const customCount = monthlyMetas.filter(m => !m.isDefault).length;
    const avg = monthlyMetas.length > 0
      ? (monthlyMetas.reduce((sum, m) => sum + m.value, 0) / monthlyMetas.length).toFixed(1)
      : 0;
    return { customCount, avg };
  }, [monthlyMetas]);

  const statsDaily = useMemo(() => {
    const customCount = dailyMetas.filter(m => !m.isDefault).length;
    const avg = dailyMetas.length > 0
      ? (dailyMetas.reduce((sum, m) => sum + m.value, 0) / dailyMetas.length).toFixed(1)
      : 0;
    return { customCount, avg };
  }, [dailyMetas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-xs text-[#6B7560]">Carregando metas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-[#E8DCC8]">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-[#1F4532]" />
          <h1 className="text-2xl font-bold text-[#1F4532]">Gerenciamento de Metas de Tempo</h1>
        </div>
        <p className="text-sm text-gray-600">
          Configure as metas de tempo de atuação (em horas) para seus dispositivos por período
        </p>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`rounded-lg p-4 ${
          saveStatus === 'saving'
            ? 'bg-blue-50 border border-blue-200'
            : saveStatus === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${
            saveStatus === 'saving'
              ? 'text-blue-700'
              : saveStatus === 'success'
              ? 'text-green-700'
              : 'text-red-700'
          }`}>
            {saveStatus === 'saving'
              ? 'Salvando...'
              : saveStatus === 'success'
              ? '✅ Meta salva com sucesso'
              : '❌ Erro ao salvar meta'}
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'monthly'
                ? 'bg-[#1F4532] text-white'
                : 'bg-[#E8DCC8] text-[#1F4532] hover:bg-[#D4CFC0]'
            }`}
          >
            Metas Mensais
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'daily'
                ? 'bg-[#1F4532] text-white'
                : 'bg-[#E8DCC8] text-[#1F4532] hover:bg-[#D4CFC0]'
            }`}
          >
            Metas Diárias
          </button>
        </div>
      </div>

      {/* Monthly Metas */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8]">
              <p className="text-xs text-[#6B7560] font-semibold mb-1">Customizadas</p>
              <p className="text-2xl font-bold text-[#1F4532]">{statsMonthly.customCount}</p>
              <p className="text-xs text-gray-500">de 12 meses</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8]">
              <p className="text-xs text-[#6B7560] font-semibold mb-1">Média</p>
              <p className="text-2xl font-bold text-[#A3B18A]">{statsMonthly.avg}h</p>
              <p className="text-xs text-gray-500">por mês</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md border border-[#E8DCC8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F0EAD2] border-b border-[#E8DCC8]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Mês</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Meta Atual (h)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Padrão API (h)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#1F4532]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyMetas.map((meta) => (
                    <tr key={meta.id} className="border-b border-[#E8DCC8] hover:bg-[#F0EAD2]/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-[#1F4532]">{meta.name}</td>
                      <td className="px-4 py-3">
                        {editingId === meta.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-24 px-2 py-1 border-2 border-[#A3B18A] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4532]"
                          />
                        ) : (
                          <span className={`text-sm ${meta.isDefault ? 'text-gray-500' : 'font-bold text-[#1F4532]'}`}>
                            {meta.value.toFixed(1)}h
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{meta.apiDefault.toFixed(1)}h</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {editingId === meta.id ? (
                            <>
                              <button
                                onClick={() => handleSave(meta)}
                                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                title="Salvar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(meta.id, meta.value)}
                              className="p-1.5 bg-[#E8DCC8] hover:bg-[#D4CFC0] text-[#1F4532] rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Daily Metas */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8]">
              <p className="text-xs text-[#6B7560] font-semibold mb-1">Customizadas</p>
              <p className="text-2xl font-bold text-[#1F4532]">{statsDaily.customCount}</p>
              <p className="text-xs text-gray-500">de {dailyMetas.length} dias</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md border border-[#E8DCC8]">
              <p className="text-xs text-[#6B7560] font-semibold mb-1">Média</p>
              <p className="text-2xl font-bold text-[#A3B18A]">{statsDaily.avg}h</p>
              <p className="text-xs text-gray-500">por dia</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md border border-[#E8DCC8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F0EAD2] border-b border-[#E8DCC8]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Dia</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Meta Atual (h)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F4532]">Padrão API (h)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#1F4532]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetas.map((meta) => (
                    <tr key={meta.id} className="border-b border-[#E8DCC8] hover:bg-[#F0EAD2]/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-[#1F4532]">{meta.name}</td>
                      <td className="px-4 py-3">
                        {editingId === meta.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-24 px-2 py-1 border-2 border-[#A3B18A] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4532]"
                          />
                        ) : (
                          <span className={`text-sm ${meta.isDefault ? 'text-gray-500' : 'font-bold text-[#1F4532]'}`}>
                            {meta.value.toFixed(1)}h
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{meta.apiDefault.toFixed(1)}h</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {editingId === meta.id ? (
                            <>
                              <button
                                onClick={() => handleSave(meta)}
                                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                title="Salvar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(meta.id, meta.value)}
                              className="p-1.5 bg-[#E8DCC8] hover:bg-[#D4CFC0] text-[#1F4532] rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informações</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• As metas de tempo de atuação definem quantas horas por período seu dispositivo deve estar ativo</li>
          <li>• Metas customizadas (não padrão) aparecem em negrito</li>
          <li>• O padrão da API é exibido para referência</li>
          <li>• Todas as alterações são salvas automaticamente no navegador</li>
        </ul>
      </div>
    </div>
  );
};

export default MetasManagement;
