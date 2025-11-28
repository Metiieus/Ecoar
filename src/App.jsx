import './App.css';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FinancialDashboard from './components/FinancialDashboard';
import DeviceDetailView from './components/DeviceDetailView';
import ControlCenter from './components/ControlCenter';
import ConsumptionTab from './components/ConsumptionTab';
import Login from './components/Login';
import { ApiDataProvider, useApiDataContext } from './context/ApiDataContext';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar se há autenticação no localStorage
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [selectedEstablishment, setSelectedEstablishment] = useState(1);
  const [selectedApiDeviceId, setSelectedApiDeviceId] = useState(33);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('device') ? parseInt(params.get('device')) : null;
  });

  const { handleDeviceChange } = useApiDataContext();

  const handleLogin = (credentials) => {
    // Aqui você pode adicionar a lógica de autenticação real
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', credentials.email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    handleDeviceChange(selectedApiDeviceId);
  }, [selectedApiDeviceId, handleDeviceChange]);

  const shouldShowDetailView = selectedDeviceId !== null;

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeSidebarTab} setActiveTab={setActiveSidebarTab} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <Header
          selectedEstablishment={selectedEstablishment}
          onEstablishmentChange={setSelectedEstablishment}
          selectedDeviceId={selectedApiDeviceId}
          onDeviceChange={setSelectedApiDeviceId}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
        <div className="p-8">
          {activeSidebarTab === 'dashboard' && (
            <>
              {shouldShowDetailView ? (
                <DeviceDetailView
                  deviceId={selectedDeviceId}
                  onBack={() => setSelectedDeviceId(null)}
                />
              ) : (
                <FinancialDashboard
                  selectedEstablishment={selectedEstablishment}
                  onSelectDevice={setSelectedDeviceId}
                />
              )}
            </>
          )}

          {activeSidebarTab === 'consumption' && (
            <ConsumptionTab />
          )}

          {activeSidebarTab === 'control' && (
            <ControlCenter />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ApiDataProvider>
      <AppContent />
    </ApiDataProvider>
  );
}

export default App;
