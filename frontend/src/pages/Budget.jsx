import React, { useState, useEffect } from 'react';
import { PieChart, Save, Trash2, Edit2 } from 'lucide-react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const Budget = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [loading, setLoading] = useState(true);

  // Form
  const [category, setCategory] = useState('Makan');
  const [limit, setLimit] = useState('');


  useEffect(() => {
    if (!user) {
      setLoading(false); // Ensure loading is false if no user
      return;
    }
    
    // Listen to Budgets
    const budgetsRef = ref(db, `budgets/${user?.id || user?.uid}`);
    const unsubscribeBudgets = onValue(budgetsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({
            id: key,
            category: key,
            monthly_limit: parseFloat(data[key]) || 0
          }));
          setBudgets(list);
        } else {
          setBudgets([]);
        }
      } catch (err) {
        console.error("CRITICAL ERROR in Budget listener:", err);
      }
    });

    // Listen to Transactions for real-time spending calculation
    const transactionsRef = ref(db, `transactions/${user?.id || user?.uid}`);
    const unsubscribeTrans = onValue(transactionsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const spending = {};
        if (data) {
          Object.values(data).forEach(t => {
            if (t.type === 'expense' && t.category) {
              spending[t.category] = (spending[t.category] || 0) + (parseFloat(t.amount) || 0);
            }
          });
        }
        setExpenses(spending);
      } catch (err) {
        console.error("CRITICAL ERROR in Budget transactions listener:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeTrans();
    };
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const budgetRef = ref(db, `budgets/${user?.id || user?.uid}/${category}`);
      await set(budgetRef, parseFloat(limit));
      
      setLimit('');
      alert('Budget berhasil disimpan!');
    } catch (err) {
      console.error("Failed to save budget:", err);
      alert('Gagal menyimpan budget: ' + err.message);
    }
  };

  const handleDelete = async (catName) => {
    if (!window.confirm(`Hapus budget untuk kategori ${catName}?`)) return;
    if (!user) return;
    
    try {
      const budgetRef = ref(db, `budgets/${user?.id || user?.uid}/${catName}`);
      await remove(budgetRef);
      alert('Budget berhasil dihapus!');
    } catch (err) {
      console.error("Failed to delete budget:", err);
      alert('Gagal menghapus budget: ' + err.message);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget Planner</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Atur batas pengeluaran per kategori.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit lg:sticky lg:top-8">
          <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <PieChart size={20} className="text-primary"/> Atur Budget
          </h3>
          <form className="space-y-4" onSubmit={handleSave}>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option>Makan</option>
                 <option>Kos</option>
                 <option>Transportasi</option>
                 <option>Jajan</option>
                 <option>Hiburan</option>
                 <option>Belanja</option>
                 <option>Kebutuhan Kampus</option>
                 <option>Tagihan / Cicilan</option>
                 <option>Lainnya</option>
               </select>
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Limit Bulanan (Rp)</label>
               <input type="number" required value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Contoh: 1500000" />
             </div>
             <button type="submit" className="w-full py-2 bg-primary hover:bg-indigo-700 text-white rounded-md flex justify-center items-center gap-2">
                <Save size={18} /> Simpan Target
             </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Progress Bulan Ini</h3>
          {budgets.length > 0 ? budgets.map(b => {
             try {
               const spent = expenses[b.category] || 0;
               const percent = Math.min((spent / (b.monthly_limit || 1)) * 100, 100).toFixed(1);
               const isOver = spent > b.monthly_limit;
               const isWarning = percent >= 80 && !isOver;

               let barColor = "bg-primary";
               if (isOver) barColor = "bg-danger";
               else if (isWarning) barColor = "bg-yellow-500";

               return (
                 <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                   <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => {
                         setCategory(b.category);
                         setLimit(b.monthly_limit);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }}
                       className="text-gray-400 hover:text-primary p-2"
                       title="Edit Budget"
                     >
                       <Edit2 size={16} />
                     </button>
                     <button 
                       onClick={() => handleDelete(b.category)}
                       className="text-gray-400 hover:text-danger p-2"
                       title="Hapus Budget"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                   <div className="flex justify-between items-end mb-2">
                     <div>
                       <span className="font-semibold text-gray-900 dark:text-white">{b.category}</span>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                         Rp {formatCurrency(spent)} dari Rp {formatCurrency(b.monthly_limit)}
                       </p>
                     </div>
                     <div className={`font-bold text-sm ${isOver ? 'text-danger' : isWarning ? 'text-yellow-600' : 'text-primary'}`}>
                       {percent}%
                     </div>
                   </div>
                   <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                     <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                   </div>
                   {isOver && (
                     <p className="text-xs text-danger mt-2">Peringatan: Kamu melebihi budget {b.category} bulan ini!</p>
                   )}
                   {isWarning && (
                     <p className="text-xs text-yellow-600 mt-2">Hati-hati: Budget {b.category} hampir habis.</p>
                   )}
                 </div>
               );
             } catch (e) {
               return null;
             }
          }) : (
             <div className="bg-white dark:bg-gray-800 p-8 text-center text-gray-500 rounded-xl border border-gray-100 dark:border-gray-700">
               Belum ada budget yang diatur.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budget;
