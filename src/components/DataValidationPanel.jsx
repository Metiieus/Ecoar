import { useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react';
import { validateAllDevices, exportValidationReport } from '../lib/dataValidator';

const DataValidationPanel = () => {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleValidate = async () => {
    setLoading(true);
    setProgress(0);
    setValidationResults(null);

    const results = await validateAllDevices((progressData) => {
      setProgress(progressData.progress);
    });

    setValidationResults(results);
    setLoading(false);
  };

  const handleExport = () => {
    if (validationResults) {
      exportValidationReport(validationResults);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Validação de Dados dos Dispositivos</h2>
        <button
          onClick={handleValidate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Validando ({progress}%)
            </>
          ) : (
            'Iniciar Validação'
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">{progress}% completo</p>
        </div>
      )}

      {/* Results Summary */}
      {validationResults && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{validationResults.summary.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 font-semibold mb-1">✅ Válidos</p>
              <p className="text-2xl font-bold text-green-900">{validationResults.summary.valid}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 font-semibold mb-1">⚠️ Avisos</p>
              <p className="text-2xl font-bold text-yellow-900">{validationResults.summary.warnings}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600 font-semibold mb-1">❌ Inválidos</p>
              <p className="text-2xl font-bold text-red-900">{validationResults.summary.invalid}</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Detalhes por Dispositivo:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {validationResults.devices.map((device) => (
                <div key={device.deviceId} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {device.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">Dispositivo {device.deviceId}</span>
                    {device.warnings.length > 0 && (
                      <AlertCircle className="w-4 h-4 text-yellow-600 ml-auto" />
                    )}
                  </div>

                  {device.issues.length > 0 && (
                    <div className="ml-7 space-y-1 mb-2">
                      {device.issues.map((issue, idx) => (
                        <p key={idx} className="text-xs text-red-600">{issue}</p>
                      ))}
                    </div>
                  )}

                  {device.warnings.length > 0 && (
                    <div className="ml-7 space-y-1">
                      {device.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-yellow-600">{warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Relatório
            </button>
            <button
              onClick={handleValidate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Validar Novamente
            </button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Validação realizada em: {new Date(validationResults.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataValidationPanel;
