// src/pages/SplashScreen.jsx
import { useState, useEffect } from 'react';
import logoUrl from '../assets/LOGORN.png';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (typeof onComplete === 'function') onComplete();
          }, 100);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      
      {/* Logo */}
      <img 
        src={logoUrl} 
        alt="SIGAP Gizi"
        className="w-20 h-20 object-contain mb-6"
      />

      {/* App Name */}
      <h1 className="text-2xl font-black text-slate-900 mb-12">
        SIGAP <span className="text-blue-600">Gizi.</span>
      </h1>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

    </div>
  );
}