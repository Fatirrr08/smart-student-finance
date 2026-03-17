import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { ref, push, remove, onValue } from 'firebase/database';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const Income = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
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
  }, [user]);

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pemasukan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Catat semua sumber pemasukanmu.</p>
        </div>
        <button 
          onClick={() => {
            setEditId(null);
            setAmount('');
            setNote('');
            setShowForm(!showForm);
          }}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 w-full sm:w-auto rounded-lg flex justify-center items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Tambah Pemasukan
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {editId ? 'Edit Data Pemasukan' : 'Tambah Data Pemasukan'}
          </h3>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" onSubmit={handleAdd}>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
               <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Contoh: 500000" />
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option>Uang Bulanan</option>
                 <option>Beasiswa</option>
                 <option>Freelance</option>
                 <option>Part Time</option>
                 <option>Lainnya</option>
               </select>
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Simpan Ke</label>
               <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option>Saldo Bank</option>
                 <option>Cash / Tunai</option>
                 <option>E-Wallet (OVO/Dana/Gopay)</option>
               </select>
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
               <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
               <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Opsional" />
             </div>
             <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 mt-2 sm:mt-0">Batal</button>
                <button type="submit" className="px-4 py-2 bg-secondary hover:bg-green-600 text-white rounded-md">Simpan</button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Table View - Hidden on Mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Tanggal</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Kategori</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Catatan/Tujuan</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right whitespace-nowrap">Jumlah</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {incomes.length > 0 ? incomes.map((inc) => (
                <tr key={inc.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{new Date(inc.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                      {inc.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 min-w-[200px]">{inc.note || '-'}</td>
                  <td className="p-4 text-sm font-semibold text-secondary text-right whitespace-nowrap">+Rp {formatCurrency(inc.amount)}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleEdit(inc)} className="text-gray-400 hover:text-primary p-2 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(inc.id)} className="text-gray-400 hover:text-danger p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">Belum ada data pemasukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card View - Mobile Only */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {incomes.length > 0 ? incomes.map((inc) => (
            <div key={inc.id} className="p-4 flex justify-between items-center group active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors">
              <div className="flex flex-col gap-1 min-w-0 pr-4" onClick={() => handleEdit(inc)}>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                     {new Date(inc.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                   </span>
                   <span className="text-xs font-bold text-secondary bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                     {inc.category}
                   </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {inc.note || 'Pemasukan'}
                </h4>
                <div className="text-base font-bold text-secondary">
                  +Rp {formatCurrency(inc.amount)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleEdit(inc)} 
                  className="p-2.5 text-gray-400 hover:text-primary bg-gray-50 dark:bg-gray-700/50 rounded-full shrink-0"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(inc.id)} 
                  className="p-2.5 text-gray-400 hover:text-danger bg-gray-50 dark:bg-gray-700/50 rounded-full shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-gray-500 italic text-sm">Belum ada data pemasukan.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Income;
