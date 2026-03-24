import React, { useState, useEffect } from 'react';
import { PieChart, Save, Trash2, Edit2 } from 'lucide-react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import GlobalFilter from '../components/GlobalFilter';
import { isCurrentWeek, isCurrentMonth } from '../utils/dateUtils';

const Budget = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('monthly'); // 'weekly' or 'monthly'

  // Form
  const [category, setCategory] = useState('Makan');
  const [limit, setLimit] = useState('');


  useEffect(() => {
    if (!user) {
      setLoading(false); // Ensure loading is false if no user
      return;
    }
    
    // Listen to Budgets for selected period
    const budgetsRef = ref(db, `budgets/${user?.id || user?.uid}/${filterType}`);
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

    // Listen to Transactions for real-time spending calculation based on period
    const transactionsRef = ref(db, `transactions/${user?.id || user?.uid}`);
    const unsubscribeTrans = onValue(transactionsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const spending = {};
        if (data) {
          Object.values(data).forEach(t => {
            const isMatch = filterType === 'weekly' ? isCurrentWeek(t.date) : isCurrentMonth(t.date);
            if (t.type === 'expense' && t.category && isMatch) {
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
  }, [user, filterType]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const budgetRef = ref(db, `budgets/${user?.id || user?.uid}/${filterType}/${category}`);
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
      const budgetRef = ref(db, `budgets/${user?.id || user?.uid}/${filterType}/${catName}`);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Budget Planner</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium mt-1">Atur batas pengeluaran {filterType === 'weekly' ? 'mingguan' : 'bulanan'} kamu.</p>
        </div>
        <GlobalFilter activeFilter={filterType} onFilterChange={setFilterType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 h-fit lg:sticky lg:top-8">
          <h3 className="text-xl font-bold mb-6 text-stone-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><PieChart size={20}/></div> Atur Budget
          </h3>
          <form className="space-y-6" onSubmit={handleSave}>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Kategori</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none appearance-none">
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
               <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Limit {filterType === 'weekly' ? 'Mingguan' : 'Bulanan'} (Rp)</label>
               <input type="number" required value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-transparent focus:border-stone-200 focus:bg-white dark:focus:bg-stone-800 rounded-xl dark:text-white font-bold transition-all outline-none" placeholder="0" />
             </div>
             <button type="submit" className="w-full py-4 bg-primary hover:opacity-90 shadow-lg shadow-primary/20 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95">
                <Save size={18} /> Simpan Target
             </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Progress {filterType === 'weekly' ? 'Minggu' : 'Bulan'} Ini</h3>
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
                  <div key={b.id} className="bg-white dark:bg-darkbg p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 relative group transition-all hover:shadow-md">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setCategory(b.category);
                          setLimit(b.monthly_limit);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-stone-400 hover:text-primary p-2.5 bg-stone-50 dark:bg-stone-900 rounded-xl transition-colors"
                        title="Edit Budget"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.category)}
                        className="text-stone-400 hover:text-danger p-2.5 bg-stone-50 dark:bg-stone-900 rounded-xl transition-colors"
                        title="Hapus Budget"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-lg font-black text-stone-900 dark:text-white tracking-tight">{b.category}</span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">
                          Rp {formatCurrency(spent)} / Rp {formatCurrency(b.monthly_limit)}
                        </p>
                      </div>
                      <div className={`text-xl font-black tracking-tight ${isOver ? 'text-danger' : isWarning ? 'text-yellow-600' : 'text-primary'}`}>
                        {percent}%
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-900 rounded-full h-3 overflow-hidden">
                      <div className={`${barColor} h-3 rounded-full transition-all duration-700 ease-out`} style={{ width: `${percent}%` }}></div>
                    </div>
                    {isOver && (
                      <p className="text-xs font-bold text-danger mt-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></div>
                        Warning: Budget {b.category} terlampaui!
                      </p>
                    )}
                    {isWarning && (
                      <p className="text-xs font-bold text-yellow-600 mt-3 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                         Limit: Budget {b.category} hampir habis.
                      </p>
                    )}
                  </div>
                );
             } catch {
                return null;
             }
          }) : (
             <div className="bg-white dark:bg-darkbg p-16 text-center text-stone-400 font-bold italic rounded-[2rem] border border-stone-100 dark:border-stone-800">
               Belum ada budget yang diatur.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budget;
