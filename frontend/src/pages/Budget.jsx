import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Save } from 'lucide-react';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [loading, setLoading] = useState(true);

  // Form
  const [category, setCategory] = useState('Makan');
  const [limit, setLimit] = useState('');

  const mockBudgets = [
    { id: 1, category: 'Makan', monthly_limit: 1500000 },
    { id: 2, category: 'Kos', monthly_limit: 500000 },
    { id: 3, category: 'Transportasi', monthly_limit: 300000 },
  ];

  const mockExpenses = {
    'Makan': 1200000,
    'Kos': 500000,
    'Transportasi': 450000, // over budget
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, rRes] = await Promise.all([
        api.get('/budget'),
        api.get(`/report/monthly?month=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
      ]);
      setBudgets(bRes.data.data || []);
      setExpenses(rRes.data.data.category_expenses || {});
    } catch (err) {
      console.warn("Using mock data for budgets");
      setBudgets(mockBudgets);
      setExpenses(mockExpenses);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budget', { category, monthly_limit: parseFloat(limit) });
      fetchData();
      setLimit('');
    } catch (err) {
      const existing = budgets.find(b => b.category === category);
      if (existing) {
        setBudgets(budgets.map(b => b.category === category ? { ...b, monthly_limit: parseFloat(limit) } : b));
      } else {
        setBudgets([...budgets, { id: Date.now(), category, monthly_limit: parseFloat(limit) }]);
      }
      setLimit('');
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8">Loading...</div>;

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
             const spent = expenses[b.category] || 0;
             const percent = Math.min((spent / b.monthly_limit) * 100, 100).toFixed(1);
             const isOver = spent > b.monthly_limit;
             const isWarning = percent >= 80 && !isOver;

             let barColor = "bg-primary";
             if (isOver) barColor = "bg-danger";
             else if (isWarning) barColor = "bg-yellow-500";

             return (
               <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <div className="flex justify-between items-end mb-2">
                   <div>
                     <span className="font-semibold text-gray-900 dark:text-white">{b.category}</span>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                       {formatCurrency(spent)} dari {formatCurrency(b.monthly_limit)}
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
             )
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
