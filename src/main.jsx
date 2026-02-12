import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import SplashScreen from './pages/SplashScreen';
import RecommendationPage from './pages/RecommendationPage';
import SchedulePage from './pages/SchedulePage';
import ConsultationPage from './pages/ConsultationPage';
import EducationPage from './pages/EducationPage';
import LoginPage from './pages/admin/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import PersagiDashboard from './pages/persagi/PersagiDashboard';
import DesktopNavbar from './components/navbar/DesktopNavbar';
import MobileNavbar from './components/navbar/MobileNavbar';
import { getCurrentUser, supabase } from './config/supabase';
import './index.css'
import PWABadge from './PWABadge';

function AppRoot() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('recommendation');
  
  // Auth States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPersagi, setIsPersagi] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [persagiUser, setPersagiUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // 1. Cek Tabel Admins
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (adminData) {
          // Gabungkan data auth + data tabel admin
          setAdminUser({ ...user, id: adminData.id }); 
          setIsAdmin(true);
        } else {
          // 2. Cek Tabel Doctors (PENTING: Ambil ID dari sini agar chat jalan)
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (doctorData) {
            // Gabungkan data auth + data tabel doctors
            setPersagiUser({ ...user, id: doctorData.id, name: doctorData.name });
            setIsPersagi(true);
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSplashComplete = () => setShowSplash(false);
  const handleNavigation = (page) => setCurrentPage(page);

  // Handler Login Pusat (Menerima profile dan role dari LoginPage)
  const handleLoginSuccess = (userProfile, role) => {
    if (role === 'admin') {
      setAdminUser(userProfile);
      setIsAdmin(true);
      window.location.href = '/admin';
    } else if (role === 'persagi') {
      setPersagiUser(userProfile);
      setIsPersagi(true);
      window.location.href = '/persagi';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mbg_guest_id');
    setAdminUser(null);
    setPersagiUser(null);
    setIsAdmin(false);
    setIsPersagi(false);
    window.location.href = '/';
  };

  // Komponen Loading yang Estetik
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-blue-100"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">SIGAP Gizi.</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Memeriksa Autentikasi...</p>
        </div>
      </div>
    </div>
  );

  // --- ROUTING LOGIC ---
  const path = window.location.pathname;

  // 1. PERSAGI Dashboard Route
  if (path.includes('/persagi')) {
    if (checkingAuth) return <LoadingScreen />;
    // Jika belum login, tampilkan LoginPage umum
    if (!isPersagi) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    return <PersagiDashboard onLogout={handleLogout} user={persagiUser} />;
  }

  // 2. ADMIN Dashboard Route
  if (path.includes('/admin')) {
    if (checkingAuth) return <LoadingScreen />;
    if (!isAdmin) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    return <Dashboard onLogout={handleLogout} user={adminUser} />;
  }

  // 3. User Facing App
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'recommendation': return <RecommendationPage />;
      case 'schedule': return <SchedulePage />;
      case 'consultation': return <ConsultationPage />;
      case 'education': return <EducationPage />;
      case 'login': 
        // Halaman login umum (biasanya untuk admin entry point)
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      default: return <RecommendationPage />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <DesktopNavbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
      />
      
      <main className="min-h-screen animate-in fade-in duration-700">
        {renderCurrentPage()}
      </main>

      <MobileNavbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
      />

      <PWABadge />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)