// src/components/AdminFloatingButton.jsx
import { Shield } from 'lucide-react';

export default function AdminFloatingButton() {
  const handleClick = () => {
    window.location.href = '/admin';
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all duration-300 hover:scale-110 active:scale-95 z-40 flex items-center justify-center group"
      title="Admin Dashboard"
      aria-label="Admin Dashboard"
    >
      <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      
      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Admin Dashboard
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-l-slate-900" />
      </div>
    </button>
  );
}
