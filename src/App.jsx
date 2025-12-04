import './App.css';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FinancialDashboard from './components/FinancialDashboard';
import DeviceDetailView from './components/DeviceDetailView';
import ControlCenter from './components/ControlCenter';
import ConsumptionTab from './components/ConsumptionTab';
import Device39Validator from './components/Device39Validator';
import Login from './components/Login';
import { ApiDataProvider, useApiDataContext } from './context/ApiDataContext';
import { ClientProvider } from './context/ClientContext';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar se há autenticação no localStorage
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [selectedApiDeviceId, setSelectedApiDeviceId] = useState(33);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('device') ? parseInt(params.get('device')) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Sidebar - Fixed on lg, Hidden on mobile */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        <Header
          selectedDeviceId={selectedApiDeviceId}
          onDeviceChange={setSelectedApiDeviceId}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Overlay for sidebar on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeSidebarTab === 'dashboard' && (
            <>
              {shouldShowDetailView ? (
                <DeviceDetailView
                  deviceId={selectedDeviceId}
                  onBack={() => setSelectedDeviceId(null)}
                />
              ) : (
                <FinancialDashboard
                  onSelectDevice={setSelectedDeviceId}
                />
              )}
            </>
          )}

          {activeSidebarTab === 'validator' && (
            <Device39Validator />
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
    <ClientProvider>
      <ApiDataProvider>
        <AppContent />
      </ApiDataProvider>
    </ClientProvider>
  );
}

export default App;
