import { Calculator, Calendar, MessageCircle, BookOpen } from 'lucide-react';
import logoUrl from '../../assets/LOGORN.png'; 

export default function DesktopNavbar({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'recommendation', label: 'Rekomendasi', icon: Calculator },
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
    { id: 'consultation', label: 'Konsultasi', icon: MessageCircle },
    { id: 'education', label: 'Edukasi', icon: BookOpen }
  ];

  return (
    <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="SIGAP Gizi Logo"
                  className="w-9 h-9 object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                SIGAP Gizi
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Informasi Gizi Pintar
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          
        </div>
      </div>
    </nav>
  );
}