// src/components/navbar/DesktopNavbar.jsx
import { Calculator, Calendar, MessageCircle, BookOpen, Shield } from 'lucide-react';
import logoUrl from '../../assets/LOGORN.png'; 

export default function DesktopNavbar({ currentPage, onNavigate }) {
  // Menu navigasi disesuaikan dengan 4 pilar aplikasi MBG
  const navItems = [
    { id: 'recommendation', label: 'Rekomendasi', icon: Calculator },
    { id: 'schedule', label: 'Jadwal MBG', icon: Calendar },
    { id: 'consultation', label: 'Konsultasi', icon: MessageCircle },
    { id: 'education', label: 'Edukasi Gizi', icon: BookOpen }
  ];

  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  return (
    <nav className="hidden md:block shadow-lg border-b border-blue-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src={logoUrl}
                alt="MBG Support Logo"
                className="w-12 h-12 object-contain filter drop-shadow-md transform transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-60" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 bg-clip-text text-transparent">
                MBG
              </h1>
              <h2 className="text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent -mt-1">
                Nutrition Support
              </h2>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${currentPage === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {/* Admin Button */}
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
              <span>Admin</span>
            </button>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
