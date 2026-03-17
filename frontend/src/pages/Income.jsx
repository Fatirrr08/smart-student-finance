import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { ref, push, remove, onValue, set } from 'firebase/database';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import GlobalFilter from '../components/GlobalFilter';
import { isCurrentWeek, isCurrentMonth } from '../utils/dateUtils';

const Income = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterType, setFilterType] = useState('monthly'); // 'weekly' or 'monthly'
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Uang Bulanan');
  const [destination, setDestination] = useState('Saldo Bank');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const incomesRef = ref(db, `transactions/${user?.id || user?.uid}`);
    const unsubscribe = onValue(incomesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(t => t.type === 'income')
            .filter(t => {
              if (filterType === 'weekly') return isCurrentWeek(t.date);
              if (filterType === 'monthly') return isCurrentMonth(t.date);
              return true;
            })
            .sort((a, b) => {
              const dateA = a.date ? new Date(a.date) : 0;
              const dateB = b.date ? new Date(b.date) : 0;
              return dateB - dateA;
            });
          setIncomes(list);
        } else {
          setIncomes([]);
        }
      } catch (err) {
        console.error("CRITICAL ERROR in Income listener:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Failed to fetch incomes from Firebase:", error);
      setIncomes([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, filterType]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const finalNote = note.includes('[Ke:') ? note : (destination !== 'Saldo Bank' ? `[Ke: ${destination}] ${note}` : `[Ke: Saldo Bank] ${note}`);
      const transactionData = { 
        type: 'income', 
        amount: parseFloat(amount), 
        category, 
        date: date || new Date().toISOString().split('T')[0],
        note: finalNote,
        updatedAt: new Date().toISOString()
      };

      if (!editId) {
        transactionData.createdAt = new Date().toISOString();
      }

      const uid = user.id || user.uid;
      const targetRef = editId 
        ? ref(db, `transactions/${uid}/${editId}`)
        : ref(db, `transactions/${uid}`);
      
      if (editId) {
        // Use set to update specific record
        await set(targetRef, { ...transactionData, id: editId });
      } else {
        await push(targetRef, transactionData);
      }
      
      // Reset form state
      setAmount('');
      setCategory('Uang Bulanan');
      setDestination('Saldo Bank');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setShowForm(false);
      setEditId(null);
      alert(editId ? 'Pemasukan berhasil diperbarui!' : 'Pemasukan berhasil ditambahkan!');
    } catch (err) {
      console.error("Failed to save income:", err);
      alert('Gagal menyimpan pemasukan: ' + err.message);
    }
  };

  const handleEdit = (inc) => {
    setEditId(inc.id);
    setAmount(inc.amount);
    setCategory(inc.category);
    
    // Extract destination from note if exists
    let cleanNote = inc.note || '';
    if (cleanNote.startsWith('[Ke:')) {
      const parts = cleanNote.split('] ');
      const dest = parts[0].replace('[Ke: ', '');
      setDestination(dest);
      cleanNote = parts[1] || '';
    }
    
    setNote(cleanNote);
    setDate(inc.date);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    if (!user) return;
    
    try {
      const itemRef = ref(db, `transactions/${user?.id || user?.uid}/${id}`);
      await remove(itemRef);
      alert('Pemasukan berhasil dihapus!');
    } catch (err) {
      console.error("Failed to delete income:", err);
      alert('Gagal menghapus pemasukan: ' + err.message);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Pemasukan</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium mt-1 pr-4">Catat semua sumber pemasukan {filterType === 'weekly' ? 'mingguan' : 'bulanan'} kamu.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <GlobalFilter activeFilter={filterType} onFilterChange={setFilterType} />
          <button 
            onClick={() => {
              setEditId(null);
              setAmount('');
              setNote('');
              setShowForm(!showForm);
            }}
            className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white px-6 py-3 w-full sm:w-auto rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Tambah Data
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-darkbg p-6 sm:p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 animate-fade-in-up">
          <h3 className="text-xl font-bold mb-6 text-stone-900 dark:text-white tracking-tight">
            {editId ? 'Edit Data Pemasukan' : 'Tambah Data Pemasukan'}
          </h3>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" onSubmit={handleAdd}>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Jumlah (Rp)</label>
               <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none" placeholder="0" />
             </div>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Kategori</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none appearance-none">
                 <option>Uang Bulanan</option>
                 <option>Beasiswa</option>
                 <option>Freelance</option>
                 <option>Part Time</option>
                 <option>Lainnya</option>
               </select>
             </div>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Simpan Ke</label>
               <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none appearance-none">
                 <option>Saldo Bank</option>
                 <option>Cash / Tunai</option>
                 <option>E-Wallet (OVO/Dana/Gopay)</option>
               </select>
             </div>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Tanggal</label>
               <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none" />
             </div>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Catatan</label>
               <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none" placeholder="Opsional" />
             </div>
             <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800 font-bold transition-all">Batal</button>
                <button type="submit" className="px-8 py-3 bg-secondary hover:opacity-90 text-white rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all active:scale-95">Simpan</button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-darkbg rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
        {/* Table View - Hidden on Mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-stone-50/50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">Tanggal</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-stone-400 whitespace-nowrap">Kategori</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Catatan/Tujuan</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right whitespace-nowrap">Jumlah</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {incomes.length > 0 ? incomes.map((inc) => (
                <tr key={inc.id} className="border-b border-stone-50 dark:border-stone-950/30 hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                  <td className="p-5 text-sm font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">{new Date(inc.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-5 text-sm whitespace-nowrap">
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {inc.category}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-medium text-stone-500 dark:text-stone-400 min-w-[200px]">{inc.note || '-'}</td>
                  <td className="p-5 text-lg font-black text-secondary text-right whitespace-nowrap tracking-tight">+Rp {formatCurrency(inc.amount)}</td>
                  <td className="p-5 flex justify-center gap-2">
                    <button onClick={() => handleEdit(inc)} className="text-stone-400 hover:text-primary p-2 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(inc.id)} className="text-stone-400 hover:text-danger p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-stone-400 font-bold italic">Belum ada data pemasukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card View - Mobile Only */}
        <div className="sm:hidden divide-y divide-stone-50 dark:divide-stone-900">
          {incomes.length > 0 ? incomes.map((inc) => (
            <div key={inc.id} className="p-5 flex justify-between items-center group active:bg-stone-50 dark:active:bg-stone-900/50 transition-colors">
              <div className="flex flex-col gap-1 min-w-0 pr-4" onClick={() => handleEdit(inc)}>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">
                     {new Date(inc.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                   </span>
                   <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                     {inc.category}
                   </span>
                </div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white truncate">
                  {inc.note || 'Pemasukan'}
                </h4>
                <div className="text-xl font-black text-secondary tracking-tight">
                  +Rp {formatCurrency(inc.amount)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(inc)} 
                  className="p-3 text-stone-400 hover:text-primary bg-stone-50 dark:bg-stone-900 rounded-2xl shrink-0 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(inc.id)} 
                  className="p-3 text-stone-400 hover:text-danger bg-stone-50 dark:bg-stone-900 rounded-2xl shrink-0 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-stone-400 font-bold italic text-sm">Belum ada data pemasukan.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Income;
