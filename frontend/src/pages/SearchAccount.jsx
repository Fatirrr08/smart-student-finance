import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, User, Mail, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchAccount = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { searchAccount } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    const data = await searchAccount(query);
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-darkbg font-sans">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">
            Cari Akun
          </h2>
          <p className="mt-2 text-sm font-medium text-stone-500 dark:text-stone-400">
            Temukan akun menggunakan Email atau Nomor HP
          </p>
        </div>

        <div className="bg-white dark:bg-darkbg py-8 px-6 shadow-xl shadow-stone-200/50 dark:shadow-none rounded-[2rem] border border-stone-100 dark:border-stone-800">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Email atau Nomor HP..."
                className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-2xl dark:text-white font-bold transition-all outline-none appearance-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Cari Sekarang'}
            </button>
          </form>

          <div className="mt-8 space-y-4">
            {results.length > 0 ? (
              results.map((acc) => (
                <div key={acc.id} className="p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center gap-4 transition-all hover:border-primary/30">
                  <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <User size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-stone-900 dark:text-white truncate">{acc.name}</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <Mail size={12} />
                        <span className="truncate">{acc.email}</span>
                      </div>
                      {acc.phone && (
                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <Phone size={12} />
                          <span>{acc.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : query && !loading && (
              <div className="text-center py-8 text-stone-400 italic">
                Tidak ada akun yang ditemukan.
              </div>
            )}
          </div>

          <Link 
            to="/login" 
            className="mt-6 w-full flex justify-center items-center gap-2 py-2 text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchAccount;
