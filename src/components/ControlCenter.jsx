import { useState } from 'react';
import { Clock, Target, AlertCircle, CheckCircle, TrendingUp, Lock } from 'lucide-react';
import { deviceRankings } from '../data/mockData';
import { useApiDataContext } from '../context/ApiDataContext';
import DataValidationPanel from './DataValidationPanel';

const ControlCenter = () => {
  const { apiData } = useApiDataContext();
  const [executionTimeGoals, setExecutionTimeGoals] = useState({});
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [showGoalInput, setShowGoalInput] = useState(null);
  const [tempGoalValue, setTempGoalValue] = useState('');

  const handleSetGoal = (deviceId, currentGoal) => {
    setShowGoalInput(deviceId);
    setTempGoalValue(currentGoal || '');
  };

  const handleSaveGoal = (deviceId) => {
    if (tempGoalValue) {
      setExecutionTimeGoals({
        ...executionTimeGoals,
        [deviceId]: parseFloat(tempGoalValue)
      });
    }
    setShowGoalInput(null);
    setTempGoalValue('');
  };

  const getStatusColor = (activeTime, goal) => {
    if (!goal) return 'bg-gray-100';
    const percentage = (activeTime / goal) * 100;
    if (percentage >= 100) return 'bg-red-100 border-red-300';
    if (percentage >= 80) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getStatusIcon = (activeTime, goal) => {
    if (!goal) return null;
    const percentage = (activeTime / goal) * 100;
    if (percentage >= 100) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (percentage >= 80) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Central de Controle</h2>
        <p className="text-gray-600">Monitore o status dos dispositivos e gerencie metas de tempo de execução</p>
      </div>

      {/* Data Validation Panel */}
      <DataValidationPanel />

      {/* Devices Status Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Status dos Dispositivos</h3>
        <div className="grid grid-cols-1 gap-4">
          {deviceRankings.map((device) => {
            const goal = executionTimeGoals[device.id];
            const percentage = goal ? ((device.activeTime / goal) * 100).toFixed(1) : 0;
            const isExpanded = expandedDevice === device.id;

            return (
              <div
                key={device.id}
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  getStatusColor(device.activeTime, goal)
                }`}
                onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{device.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{device.name}</h4>
                      <p className="text-sm text-gray-600">Posição #{device.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(device.activeTime, goal)}
                  </div>
                </div>

                {/* Main Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Tempo Ativo</p>
                    <p className="text-xl font-bold text-gray-900">{device.activeTime}h</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Consumo</p>
                    <p className="text-xl font-bold text-gray-900">{device.consumption.toLocaleString()}W</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Potência Média</p>
                    <p className="text-xl font-bold text-gray-900">{device.avgPower.toLocaleString()}W</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-xl font-bold text-gray-900">{device.score}</p>
                  </div>
                </div>

                {/* Meta from API Section */}
                {apiData?.meta !== null && apiData?.meta !== undefined && (
                  <div className="bg-white/60 rounded-lg p-4 border border-blue-200 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-900">Meta (API)</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{apiData.meta}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Valor definido na API (somente leitura)</p>
                  </div>
                )}

                {/* Goal Section */}
                {isExpanded && (
                  <div className="bg-white/60 rounded-lg p-4 border-t border-gray-200 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal-600" />
                        <span className="font-bold text-gray-900">Meta de Tempo de Execução</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetGoal(device.id, goal);
                        }}
                        className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
                      >
                        {goal ? 'Editar' : 'Definir'}
                      </button>
                    </div>

                    {showGoalInput === device.id ? (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="number"
                          step="0.5"
                          value={tempGoalValue}
                          onChange={(e) => setTempGoalValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Digite a meta em horas"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveGoal(device.id);
                          }}
                          className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    ) : null}

                    {goal ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Meta: {goal}h</span>
                          <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Tempo Ativo: {device.activeTime}h</span>
                          <span>Meta: {goal}h</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">Nenhuma meta definida. Clique em "Definir" para adicionar uma meta.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-gray-900">Total de Tempo Ativo</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{deviceRankings.reduce((sum, d) => sum + d.activeTime, 0)}h</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-teal-600" />
            <h4 className="font-bold text-gray-900">Metas Configuradas</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{Object.keys(executionTimeGoals).length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-gray-900">Dentro da Meta</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {deviceRankings.filter(d => {
              const goal = executionTimeGoals[d.id];
              return goal && (d.activeTime / goal) * 100 < 100;
            }).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlCenter;
