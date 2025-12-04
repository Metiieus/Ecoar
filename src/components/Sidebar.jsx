import { LayoutDashboard, BarChart3, Settings, CheckCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const Sidebar = ({ activeTab = 'dashboard', setActiveTab, onLogout, onClose }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Visualize métricas e gráficos de energia' },
    { id: 'validator', icon: CheckCircle, label: 'Validador de Dados', tooltip: 'Valide os dados recebidos da API' },
    { id: 'consumption', icon: BarChart3, label: 'Consumo', tooltip: 'Em breve', disabled: true },
    { id: 'control', icon: Settings, label: 'Central de Controle', tooltip: 'Em breve', disabled: true }
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#1F4532] to-[#2D5740] text-[#F0EAD2] flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-[#A3B18A]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A3B18A]/20 flex items-center justify-center">
            <span className="text-lg font-bold">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Ecoar</h1>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-[#D4CFC0]'
                    : activeTab === item.id
                    ? 'bg-[#A3B18A]/25 shadow-lg backdrop-blur-sm'
                    : 'text-[#D4CFC0] hover:bg-[#A3B18A]/15'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs px-2 py-1 bg-[#A3B18A]/30 rounded font-semibold">
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
      <div className="p-6 border-t border-[#A3B18A]/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A3B18A]/25 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">EA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Ecoar</p>
            <p className="text-xs text-[#D4CFC0]">Sistema v2.0</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[#D4CFC0] hover:bg-[#A3B18A]/15 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
