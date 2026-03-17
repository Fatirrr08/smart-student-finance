import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ref, push, remove, onValue } from 'firebase/database';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const Income = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
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
      const finalNote = destination !== 'Saldo Bank' ? `[Ke: ${destination}] ${note}` : `[Ke: Saldo Bank] ${note}`;
      const newTransaction = { 
        type: 'income', 
        amount: parseFloat(amount), 
        category, 
        date: date || new Date().toISOString().split('T')[0], // Ensure date is set
        note: finalNote,
        createdAt: new Date().toISOString() // Add a timestamp
      };

      const uid = user.id || user.uid;
      const incomesRef = ref(db, `transactions/${uid}`);
      
      console.log("=== DEBUG FIREBASE V2 ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Current User Context:", user);
      console.log("Firebase Auth UID:", auth.currentUser ? auth.currentUser.uid : "NULL (NOT AUTHENTICATED)");
      console.log("Target Path:", `transactions/${uid}`);
      
      await push(incomesRef, newTransaction);
      
      // Reset form state
      setAmount('');
      setCategory('Uang Bulanan');
      setDestination('Saldo Bank');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setShowForm(false);
      alert('Pemasukan berhasil ditambahkan!');
    } catch (err) {
      console.error("Failed to add income:", err);
      alert('Gagal menambahkan pemasukan: ' + err.message);
    }
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

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pemasukan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Catat semua sumber pemasukanmu.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 w-full sm:w-auto rounded-lg flex justify-center items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Tambah Pemasukan
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Tambah Data Pemasukan</h3>
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
        <div className="overflow-x-auto">
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
              {incomes.length > 0 ? incomes.map((inc) => {
                try {
                  return (
                    <tr key={inc.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{new Date(inc.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                          {inc.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400 min-w-[200px]">{inc.note || '-'}</td>
                      <td className="p-4 text-sm font-semibold text-secondary text-right whitespace-nowrap">+{formatCurrency(inc.amount)}</td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => handleDelete(inc.id)} className="text-gray-400 hover:text-danger p-2 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                } catch (e) {
                  return null;
                }
              }) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data pemasukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Income;
