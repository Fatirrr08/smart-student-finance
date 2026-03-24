import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, UserPlus } from 'lucide-react';

const Register = () => {
  const [regMethod, setRegMethod] = useState('email'); // 'email' or 'phone'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, loginWithGoogle, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const target = regMethod === 'email' ? email : phone;
    if (!target) {
      setError(`Silakan masukkan ${regMethod === 'email' ? 'email' : 'nomor HP'}`);
      setLoading(false);
      return;
    }

    try {
      const res = await sendOTP(target);
      if (res.debug_otp) {
        setShowOtpStep(true);
        if (res.message && res.message.includes("(Simulasi)")) {
          setError("Mode Simulasi: Gunakan OTP 123456");
        }
      } else if (res.error) {
        setError(res.error === "Failed to fetch" ? "Error: Backend tidak terjangkau (Cek localhost:8080). Menggunakan Mode Simulasi..." : res.error);
        // Fallback to simulation even if AuthContext didn't catch it for some reason
        setShowOtpStep(true);
      } else {
        setShowOtpStep(true);
      }
    } catch {
      setError("Gagal terhubung. Mode Simulasi Aktif.");
      setShowOtpStep(true);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const target = regMethod === 'email' ? email : phone;
    
    // Verify OTP first
    const vRes = await verifyOTP(target, otp);
    if (vRes.error && !vRes.error.includes("Simulation Mode")) {
      setError(vRes.error === "Failed to fetch" ? "Error: Backend tidak terjangkau. Melanjutkan Registrasi..." : "Kode OTP Salah");
      // If it's just a network error, we can still proceed in simulation mode
      if (vRes.error !== "Failed to fetch") {
        setLoading(false);
        return;
      }
    }

    // For Firebase, we always need an email. 
    // If they used phone, we create a placeholder email: phone@smartfin.local
    const finalEmail = regMethod === 'email' ? email : `${phone.replace('+', '')}@smartfin.local`;
    
    const res = await register(name, finalEmail, password);
    if (res.success) {
      // Update profile with real phone if provided
      if (regMethod === 'phone') {
        // Here we could call another backend sync to link the phone
      }
      navigate('/login');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await loginWithGoogle();
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-darkbg font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <TrendingUp className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">
          Create SmartFin Account
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
          Or{' '}
          <Link to="/login" className="font-bold text-primary hover:opacity-80 transition-opacity">
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg py-10 px-6 shadow-xl shadow-stone-200/50 dark:shadow-none sm:rounded-[2rem] sm:px-10 border border-stone-100 dark:border-stone-800">
          <form className="space-y-6" onSubmit={showOtpStep ? handleRegister : handleSendOtp}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-danger p-3 rounded-md text-sm text-center font-bold">
                {error}
              </div>
            )}

            {!showOtpStep ? (
              <>
                <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => setRegMethod('email')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${regMethod === 'email' ? 'bg-white dark:bg-stone-800 text-primary shadow-sm' : 'text-stone-400'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegMethod('phone')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${regMethod === 'phone' ? 'bg-white dark:bg-stone-800 text-primary shadow-sm' : 'text-stone-400'}`}
                  >
                    Nomor HP
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  {regMethod === 'email' ? (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                        placeholder="name@company.com"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                        placeholder="+62..."
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 text-center">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-4 bg-stone-50 dark:bg-stone-900 border-primary focus:border-primary-600 rounded-2xl dark:text-white font-black text-3xl text-center tracking-[1em] outline-none"
                  placeholder="000000"
                />
                <p className="mt-4 text-xs text-center text-stone-500">
                  Kami telah mengirimkan kode ke {email || phone}
                </p>
                <button 
                  type="button"
                  onClick={() => setShowOtpStep(false)}
                  className="mt-2 w-full text-xs font-bold text-primary hover:underline"
                >
                  Ganti email/nomor?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    <UserPlus className="mr-2" size={18} />
                    {showOtpStep ? 'Verify & Register' : 'Get Started'}
                  </>
                )}
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 flex justify-center items-center gap-2 transition-all hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 disabled:opacity-50 mt-4"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="mr-2 w-5 h-5" />
                Sign in with Google
              </button>
            </div>
          </form>
          
          <div className="mt-8 border-t border-stone-100 dark:border-stone-800 pt-8 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">
             Sudah punya akun? <Link to="/login" className="text-primary font-bold hover:underline">Mulai kelola keuanganmu sekarang</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
