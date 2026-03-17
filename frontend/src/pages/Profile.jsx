import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save, LogOut, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const Profile = () => {
  const { user, logout, changePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdating(true);
    setMessage({ type: '', text: '' });
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setPassMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
    }
    if (newPassword.length < 6) {
      return setPassMessage({ type: 'error', text: 'Password minimal 6 karakter!' });
    }
    setIsChangingPass(true);
    setPassMessage({ type: '', text: '' });
    const res = await changePassword(newPassword);
    if (res.success) {
      setPassMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassMessage({ type: 'error', text: res.message });
    }
    setIsChangingPass(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up font-sans">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">Profil Pengguna</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium mt-1">Kelola data diri dan keamanan akun SmartFin Anda.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card & Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-darkbg rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary to-indigo-600 relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
            </div>
            <div className="px-8 pb-10">
              <div className="relative -mt-12 mb-8 flex items-end gap-6">
                <div className="h-28 w-28 rounded-[2rem] bg-stone-50 dark:bg-stone-900 border-4 border-white dark:border-stone-900 shadow-xl flex items-center justify-center text-primary overflow-hidden">
                   <span className="text-5xl font-black">{name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">{name}</h2>
                  <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">{user?.email}</p>
                </div>
              </div>

              {message.text && (
                <div className={`p-4 mb-8 rounded-2xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                      <User size={14} /> Nama Lengkap
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                      placeholder="Nama Lengkap Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                      <Mail size={14} /> Alamat Email
                    </label>
                    <input 
                      type="email" 
                      value={user?.email} 
                      disabled
                      className="w-full p-3 bg-stone-100 dark:bg-stone-900/50 border-transparent rounded-xl text-stone-400 font-bold opacity-70 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="flex-1 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white font-bold py-4 px-6 rounded-2xl transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Save size={18} /> {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button 
                    type="button" 
                    onClick={logout}
                    className="p-4 bg-stone-50 dark:bg-stone-900 text-danger hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl transition-colors active:scale-95"
                    title="Keluar Akun"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security / Password Side */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-3 mb-6">
               <div className="p-2 bg-primary/10 rounded-xl text-primary"><Key size={20}/></div> Keamanan
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-5">
              {passMessage.text && (
                <div className={`p-3 rounded-xl text-[11px] font-bold text-center mb-4 ${passMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {passMessage.text}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Password Baru</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Konfirmasi</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={isChangingPass}
                className="w-full bg-stone-900 dark:bg-stone-800 hover:bg-black dark:hover:bg-stone-700 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Shield size={18} /> {isChangingPass ? 'Memproses...' : 'Ganti Password'}
              </button>
            </form>
          </div>

          <div className="bg-primary p-8 rounded-[2rem] text-white shadow-xl shadow-primary/20">
            <h4 className="text-lg font-black tracking-tight mb-2">Tips Keamanan</h4>
            <p className="text-sm text-indigo-100/80 font-medium leading-relaxed">
              Gunakan password yang kuat dengan kombinasi huruf, angka, dan simbol untuk melindungi data finansial SmartFin Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
