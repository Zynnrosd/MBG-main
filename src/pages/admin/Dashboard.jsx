import { useState, useEffect } from 'react';
import { MapPin, Utensils, Users, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { signOut, getCurrentUser } from '../../config/supabase';
import LocationsManager from '../../components/admin/LocationsManager';
import MenusManager from '../../components/admin/MenusManager'; // Pastikan import ini ada
import DoctorsManager from '../../components/admin/DoctorsManager';
import EducationManager from '../../components/admin/EducationManager';

export default function Dashboard({ onLogout }) {
  // Default tab bisa ke locations atau menus
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
    { id: 'locations', label: 'Kelola Lokasi Dapur', icon: MapPin, component: LocationsManager },
    { id: 'menus', label: 'Kelola Menu Makanan', icon: Utensils, component: MenusManager }, // Tab Terpisah
    { id: 'doctors', label: 'Kelola Dietisien', icon: Users, component: DoctorsManager },
    { id: 'education', label: 'Konten Edukasi', icon: BookOpen, component: EducationManager }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-xl hover:bg-slate-100">
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">MBG Nutrition Support</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium text-sm">
                <LogOut size={18} /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className={`${showMobileMenu ? 'block' : 'hidden'} md:block md:w-64 shrink-0`}>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 sticky top-24">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <Icon size={20} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {ActiveComponent && <ActiveComponent />}
          </main>
        </div>
      </div>
    </div>
  );
}