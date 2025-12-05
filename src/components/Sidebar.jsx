import { LayoutDashboard, BarChart3, Settings, CheckCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const Sidebar = ({ activeTab = 'dashboard', setActiveTab, onLogout, onClose }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Visualize métricas e gráficos de energia' },
    { id: 'consumption', icon: BarChart3, label: 'Consumo', tooltip: 'Em breve', disabled: true },
    { id: 'control', icon: Settings, label: 'Central de Controle', tooltip: 'Monitore dispositivos e valide dados' }
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#1F4532] to-[#2D5740] text-[#F0EAD2] flex flex-col shadow-lg overflow-y-auto">
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-[#A3B18A]/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A3B18A]/20 flex items-center justify-center">
            <span className="text-lg font-bold">E</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">Ecoar</h1>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
        {menuItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (!item.disabled) {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 relative text-sm sm:text-base ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-[#D4CFC0]'
                    : activeTab === item.id
                    ? 'bg-[#A3B18A]/25 shadow-lg backdrop-blur-sm'
                    : 'text-[#D4CFC0] hover:bg-[#A3B18A]/15'
                }`}
              >
                <item.icon className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs px-2 py-1 bg-[#A3B18A]/30 rounded font-semibold whitespace-nowrap">
                    Em breve
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 sm:p-6 border-t border-[#A3B18A]/40 space-y-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-[#A3B18A]/25 flex items-center justify-center flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold">EA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate">Ecoar</p>
            <p className="text-xs text-[#D4CFC0]">Sistema v2.0</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg text-[#D4CFC0] hover:bg-[#A3B18A]/15 transition-all duration-200"
          >
            <LogOut className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="font-medium text-xs sm:text-sm">Sair</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
