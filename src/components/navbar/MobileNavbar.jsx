// src/components/navbar/MobileNavbar.jsx
import { Calculator, Calendar, MessageCircle, BookOpen, Shield } from 'lucide-react';

export default function MobileNavbar({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'recommendation', label: 'Gizi', icon: Calculator },
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
    { id: 'consultation', label: 'Tanya', icon: MessageCircle },
    { id: 'education', label: 'Info', icon: BookOpen }
  ];

  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-blue-100 px-2 py-3 md:hidden flex justify-between items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-200 flex-1 ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
      
      {/* Admin Button untuk Mobile */}
      <button
        onClick={handleAdminClick}
        className="flex flex-col items-center gap-1 transition-all duration-200 flex-1 text-slate-800"
      >
        <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-[10px] font-bold">Admin</span>
      </button>
    </nav>
  );
}
