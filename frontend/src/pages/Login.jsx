import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
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
          SmartFin Login
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
          Or{' '}
          <Link to="/register" className="font-bold text-primary hover:opacity-80 transition-opacity">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg py-10 px-6 shadow-xl shadow-stone-200/50 dark:shadow-none sm:rounded-[2rem] sm:px-10 border border-stone-100 dark:border-stone-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-danger p-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none appearance-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none appearance-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                  Lupa Password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : (
                  <>
                    <LogIn className="mr-2" size={18} />
                    Login to Dashboard
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
             Silakan login menggunakan Email atau Google.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
