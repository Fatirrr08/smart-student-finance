import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Send, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const res = await resetPassword(email);
    if (res.success) {
      setMessage({ type: 'success', text: 'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam.' });
      setEmail('');
    } else {
      setMessage({ type: 'error', text: res.message });
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
          Lupa Password?
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
          Masukkan email Anda untuk menerima link reset password.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg py-10 px-6 shadow-xl shadow-stone-200/50 dark:shadow-none sm:rounded-[2rem] sm:px-10 border border-stone-100 dark:border-stone-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-bold text-center ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message.text}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send size={18} />
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>

            <Link 
              to="/login" 
              className="w-full flex justify-center items-center gap-2 py-4 text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
