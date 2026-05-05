import { Calculator, Calendar, MessageCircle, BookOpen, LogIn } from 'lucide-react';

export default function MobileNavbar({ currentPage, onNavigate }) {
  // ================= NAV ITEMS =================
  const navItems = [
    { id: 'recommendation', label: 'Rekomendasi', icon: Calculator },
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
    { id: 'consultation', label: 'Konsultasi', icon: MessageCircle },
    { id: 'education', label: 'Edukasi', icon: BookOpen },
    { id: 'login', label: 'Login', icon: LogIn }
  ];

  // ================= UI =================
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-2 shadow-lg safe-area-bottom md:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 min-w-[60px]
                rounded-xl transition-all duration-200
                ${isActive ? 'text-blue-600' : 'text-slate-400'}
              `}
            >
              {/* Icon */}
              <div
                className={`
                  p-2 rounded-lg transition-all
                  ${isActive ? 'bg-blue-50' : ''}
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Label */}
              <span
                className={`
                  text-xs
                  ${isActive ? 'font-semibold' : 'font-medium'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
