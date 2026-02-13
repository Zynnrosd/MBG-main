import { useState, useEffect } from 'react';
import { MapPin, Utensils, Users, BookOpen, LogOut, Menu, X, Shield } from 'lucide-react';
import { signOut, getCurrentUser } from '../../config/supabase';
import LocationsManager from '../../components/admin/LocationsManager';
import MenusManager from '../../components/admin/MenusManager';
import DoctorsManager from '../../components/admin/DoctorsManager';
import EducationManager from '../../components/admin/EducationManager';

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('locations'); 
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const tabs = [
    { id: 'locations', label: 'Lokasi Dapur', icon: MapPin, component: LocationsManager },
    { id: 'menus', label: 'Menu Makanan', icon: Utensils, component: MenusManager },
    { id: 'doctors', label: 'Dietisien', icon: Users, component: DoctorsManager },
    { id: 'education', label: 'Konten Edukasi', icon: BookOpen, component: EducationManager }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600">
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Shield size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Admin <span className="text-blue-600">Dashboard.</span>
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">Sistem Informasi Gizi Anak dan Ibu Terpadu</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 font-bold text-xs uppercase tracking-widest transition-all">
                <LogOut size={18} /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className={`${showMobileMenu ? 'block' : 'hidden'} md:block md:w-64 shrink-0`}>
            <div className="bg-white rounded-[2rem] border border-slate-100 p-4 space-y-2 sticky top-24 shadow-sm">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.2rem] transition-all font-bold text-sm ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <Icon size={20} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {ActiveComponent && <ActiveComponent />}
          </main>
        </div>
      </div>
    </div>
  );
}