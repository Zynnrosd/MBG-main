// src/main.jsx
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import SplashScreen from './pages/SplashScreen';
import RecommendationPage from './pages/RecommendationPage';
import SchedulePage from './pages/SchedulePage';
import ConsultationPage from './pages/ConsultationPage';
import EducationPage from './pages/EducationPage';
import LoginPage from './pages/admin/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import DesktopNavbar from './components/navbar/DesktopNavbar';
import MobileNavbar from './components/navbar/MobileNavbar';
import AdminFloatingButton from './components/AdminFloatingButton';
import { getCurrentUser } from './config/supabase';
import './index.css'
import PWABadge from './PWABadge';

function AppRoot() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('recommendation');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    // Check if we're on admin path
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      const user = await getCurrentUser();
      if (user) {
        setAdminUser(user);
        setIsAdmin(true);
      }
    }
    setCheckingAuth(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleAdminLogin = (user) => {
    setAdminUser(user);
    setIsAdmin(true);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdmin(false);
    window.location.href = '/';
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'recommendation':
        return <RecommendationPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'consultation':
        return <ConsultationPage />;
      case 'education':
        return <EducationPage />;
      default:
        return <RecommendationPage />;
    }
  };

  // Admin Login/Dashboard Route
  if (window.location.pathname.includes('/admin')) {
    if (checkingAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-medium">Memeriksa autentikasi...</p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return <LoginPage onLoginSuccess={handleAdminLogin} />;
    }

    return <Dashboard onLogout={handleAdminLogout} />;
  }

  // User-facing app
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNavbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
      />
      
      <main className="min-h-screen">
        {renderCurrentPage()}
      </main>

      <MobileNavbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
      />

      {/* Floating Admin Button - Opsional, bisa dikomentari jika tidak perlu */}
      <AdminFloatingButton />

      <PWABadge />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
