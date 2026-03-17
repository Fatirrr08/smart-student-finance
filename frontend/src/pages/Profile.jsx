import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save, LogOut } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const Profile = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsUpdating(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name
        });
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
        // Current implementation of AuthContext might not automatically refresh the user object
        // but it typically updates on the next auth state change or manual refresh
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: 'Gagal memperbarui profil: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil Pengguna</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola informasi akun Anda di sini.</p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-indigo-600"></div>
        <div className="px-6 pb-8">
          <div className="relative -mt-12 mb-6">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-800 shadow-lg text-primary overflow-hidden">
               <span className="text-4xl font-bold">{name.charAt(0).toUpperCase()}</span>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 mb-6 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={16} className="text-gray-400" /> Nama Lengkap
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                  placeholder="Nama Lengkap Anda"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" /> Alamat Email
                </label>
                <input 
                  type="email" 
                  value={user?.email} 
                  disabled
                  className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                disabled={isUpdating}
                className="flex-1 bg-primary hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-primary/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                <Save size={18} /> {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              
              <button 
                type="button" 
                onClick={logout}
                className="px-6 py-3 border border-red-100 dark:border-red-900/30 text-danger font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex justify-center items-center gap-2"
              >
                <LogOut size={18} /> Keluar Akun
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-primary shadow-sm shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">Keamanan Akun</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Password Anda tidak ditampilkan untuk alasan keamanan. Untuk merubah password, gunakan fitur Lupa Password saat login.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
