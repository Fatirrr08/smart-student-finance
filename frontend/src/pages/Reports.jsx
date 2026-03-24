import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const { user } = useAuth();
  const [report, setReport] = useState({
    balance: 0,
    total_income: 0,
    total_expense: 0,
    category_expenses: {},
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);


  useEffect(() => {
    if (!user) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    
    setTimeout(() => setLoading(true), 0);
    const transactionsRef = ref(db, `transactions/${user?.id || user?.uid}`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transList = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(t => t.date && t.date.startsWith(month))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let income = 0;
        let expense = 0;
        const catEx = {};
        
        transList.forEach(t => {
          const amt = parseFloat(t.amount) || 0;
          if (t.type === 'income') {
            income += amt;
          } else {
            expense += amt;
            catEx[t.category] = (catEx[t.category] || 0) + amt;
          }
        });

        setReport({
          balance: income - expense,
          total_income: income,
          total_expense: expense,
          category_expenses: catEx,
          transactions: transList
        });
      } else {
        setReport({ balance: 0, total_income: 0, total_expense: 0, category_expenses: {}, transactions: [] });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase Reports error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, month]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const exportCSV = () => {
    if (!report || !report.transactions) return;
    
    const headers = ["Tanggal", "Tipe", "Kategori", "Jumlah", "Catatan"];
    const rows = report.transactions.map(t => [
      t.date, 
      t.type, 
      t.category, 
      t.amount, 
      t.note || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const catNames = Object.keys(report.category_expenses || {});
  const catVals = Object.values(report.category_expenses || {});
  const doughnutData = {
    labels: catNames,
    datasets: [{
      data: catVals,
      backgroundColor: ['#4F46E5', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'],
      borderWidth: 0,
    }],
  };

  return (
    <div className="space-y-8 animate-fade-in-up font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">Laporan Bulanan</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium mt-1">Evaluasi keseluruhan aktivitas keuanganmu.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="p-3 border-transparent rounded-[1rem] bg-stone-50 dark:bg-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 font-bold transition-all"
          />
          <button 
            onClick={exportCSV}
            className="bg-stone-900 dark:bg-stone-800 hover:opacity-90 text-white px-6 py-3 rounded-[1.25rem] flex items-center gap-2 font-bold shadow-lg shadow-stone-200 dark:shadow-none transition-all active:scale-95"
          >
            <Download size={20} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-darkbg p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 md:col-span-2 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Total Pemasukan</p>
               <h3 className="text-3xl font-black text-secondary">Rp {formatCurrency(report.total_income)}</h3>
            </div>
            <div className="h-14 w-14 bg-secondary/10 text-secondary flex justify-center items-center rounded-2xl font-black text-2xl shadow-inner">+</div>
         </div>
         <div className="bg-white dark:bg-darkbg p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 md:col-span-2 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Total Pengeluaran</p>
               <h3 className="text-3xl font-black text-danger">Rp {formatCurrency(report.total_expense)}</h3>
            </div>
            <div className="h-14 w-14 bg-danger/10 text-danger flex justify-center items-center rounded-2xl font-black text-2xl shadow-inner">-</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800">
          <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight mb-8">Distribusi</h3>
          <div className="h-64 flex justify-center">
            {catNames.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'bold' } } } } }} />
            ) : (
              <div className="text-stone-400 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16}/> Belum ada data
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 h-[32rem] overflow-y-auto custom-scrollbar">
          <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight mb-6 flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20}/></div> Rincian Transaksi
          </h3>
          <div className="space-y-4">
             {report.transactions && report.transactions.length > 0 ? report.transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl hover:scale-[1.01] transition-transform">
                   <div>
                     <span className="font-black text-stone-900 dark:text-white">{t.category}</span>
                     <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{t.date} • {t.note}</p>
                   </div>
                    <div className={`text-lg font-black ${t.type === 'income' ? 'text-secondary' : 'text-danger'}`}>
                      {t.type === 'income' ? '+' : '-'}Rp {formatCurrency(t.amount)}
                    </div>
                </div>
             )) : (
               <div className="text-center text-stone-400 py-16 font-bold flex flex-col items-center gap-4">
                 <div className="h-20 w-20 bg-stone-50 dark:bg-stone-900 rounded-full flex items-center justify-center">
                   <FileText size={40} className="opacity-20"/>
                 </div>
                 Tidak ada transaksi di bulan ini.
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
