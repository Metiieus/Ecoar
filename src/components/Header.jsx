import { useState } from 'react';
import { Bell, ChevronDown, LogOut, User, Menu } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { devices, DEVICE_ID_ALL, getDeviceById } from '../data/devices';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';

const Header = ({ selectedDeviceId, onDeviceChange, onLogout, onToggleSidebar, sidebarOpen }) => {
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { clientName } = useClient();

  const currentDevice = getDeviceById(selectedDeviceId) || devices[0];
  const userEmail = localStorage.getItem('userEmail') || 'usuario@example.com';

  const handleSelectDevice = (deviceId) => {
    onDeviceChange(deviceId);
    setIsDeviceDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="bg-white border-b border-[#E8DCC8] px-3 sm:px-6 lg:px-8 py-3 sm:py-5 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden flex-shrink-0 w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-[#E8DCC8] hover:bg-[#D4CFC0] flex items-center justify-center transition-colors"
          >
            <Menu className="w-4 sm:w-5 h-4 sm:h-5 text-[#1F4532]" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-[#6B7560] truncate">Sistema de Gestão de Energia</p>
            <h1 className="text-base sm:text-2xl font-bold text-[#1F4532] mt-0.5 sm:mt-1 truncate">{clientName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-wrap justify-end">

          {/* Device Selector Dropdown */}
          <div className="relative hidden md:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg bg-[#E8DCC8] hover:bg-[#D4CFC0] transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden lg:inline font-medium text-[#1F4532]">{currentDevice.name}</span>
                  <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 text-[#6B7560] flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Selecione um dispositivo para visualizar dados
              </TooltipContent>
            </Tooltip>

            {isDeviceDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-[#E8DCC8] z-50 max-h-96 overflow-y-auto">
                <button
                  onClick={() => handleSelectDevice(DEVICE_ID_ALL)}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#F0EAD2] transition-colors border-b border-[#E8DCC8] ${
                    selectedDeviceId === DEVICE_ID_ALL ? 'bg-[#A3B18A]/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-[#1F4532]">Todos os Equipamentos</p>
                      <p className="text-xs text-[#6B7560]">Agregado</p>
                    </div>
                    {selectedDeviceId === DEVICE_ID_ALL && (
                      <div className="w-2 h-2 rounded-full bg-[#1F4532]"></div>
                    )}
                  </div>
                </button>
                {devices.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => handleSelectDevice(dev.id)}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#F0EAD2] transition-colors border-b border-[#E8DCC8] last:border-b-0 ${
                      selectedDeviceId === dev.id ? 'bg-[#A3B18A]/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-[#1F4532]">{dev.name}</p>
                        <p className="text-xs text-[#6B7560]">{dev.location}</p>
                      </div>
                      {selectedDeviceId === dev.id && (
                        <div className="w-2 h-2 rounded-full bg-[#1F4532]"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-[#E8DCC8] hover:bg-[#D4CFC0] flex items-center justify-center transition-colors relative">
                <Bell className="w-4 sm:w-5 h-4 sm:h-5 text-[#1F4532]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Você tem 1 notificação pendente
            </TooltipContent>
          </Tooltip>

          {/* User Profile Dropdown */}
          <div className="relative flex-shrink-0 ml-1 sm:ml-4 sm:pl-4 border-l border-[#E8DCC8]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-3 hover:bg-[#F0EAD2] px-1 sm:px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="w-7 sm:w-10 h-7 sm:h-10 rounded-lg bg-gradient-to-br from-[#A3B18A] to-[#1F4532] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">EA</span>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-[#6B7560]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Menu do usuário
              </TooltipContent>
            </Tooltip>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-[#E8DCC8] z-50">
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-[#E8DCC8]">
                  <p className="text-xs sm:text-sm font-medium text-[#1F4532]">Minha Conta</p>
                  <p className="text-xs text-[#6B7560] truncate">{userEmail}</p>
                </div>
                <button
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#F0EAD2] transition-colors flex items-center gap-2 text-[#1F4532] text-xs sm:text-sm"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Perfil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600 border-t border-[#E8DCC8] text-xs sm:text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
