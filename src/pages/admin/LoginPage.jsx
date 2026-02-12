import { useState } from 'react';
import { Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { signIn, supabase } from '../../config/supabase';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign In ke Supabase Auth
      const { data: authData, error: authError } = await signIn(email, password);
      
      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'Email atau password salah.' 
          : 'Terjadi kesalahan autentikasi.');
      }

      if (authData.user) {
        // 2. Cek Peran Pengguna (Admin vs Dietisien)
        
        // A. Cek Tabel Admins
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (adminData) {
          // GABUNGKAN data auth dengan data profil admin
          const fullAdminProfile = { ...authData.user, ...adminData };
          onLoginSuccess(fullAdminProfile, 'admin'); 
          return;
        }

        // B. Cek Tabel Doctors (Dietisien)
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (doctorData) {
          // Cek status aktif dietisien
          if (!doctorData.is_active) {
             throw new Error('Akun Anda dinonaktifkan. Hubungi admin.');
          }
          // PENTING: Gunakan ID dari tabel doctors, bukan Auth ID, agar chat sinkron
          const fullDoctorProfile = { ...authData.user, ...doctorData, id: doctorData.id }; 
          
          onLoginSuccess(fullDoctorProfile, 'persagi'); 
          return;
        }

        // C. Jika user ada di Auth tapi tidak di kedua tabel
        throw new Error('Akun tidak memiliki akses ke dashboard ini.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
      // Logout jika gagal validasi role agar sesi bersih
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
            <Shield size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
            <p className="text-slate-500 font-medium mt-1">MBG Nutrition Support</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Masuk ke Dashboard</h2>
            <p className="text-sm text-slate-500">Masukkan kredensial admin Anda</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                Email Admin
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mbg.com"
                  className="w-full pl-12 p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </span>
            ) : (
              'Masuk Dashboard'
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-400">
              Hanya admin yang memiliki akses ke halaman ini
            </p>
          </div>
        </form>

        {/* Footer Info */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex justify-center items-center gap-2">
            <div className="h-px w-8 bg-slate-200" />
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">Secure Access</p>
            <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}