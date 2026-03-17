import React, { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
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
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const transactionsRef = ref(db, `transactions/${user.id || user.uid}`);
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

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan Bulanan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Evaluasi keseluruhan aktivitas keuanganmu.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary"
          />
          <button 
            onClick={exportCSV}
            className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total Pemasukan</p>
               <h3 className="text-2xl font-bold text-secondary">{formatCurrency(report.total_income)}</h3>
            </div>
            <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 text-secondary flex justify-center items-center rounded-xl font-bold text-xl">+</div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
               <h3 className="text-2xl font-bold text-danger">{formatCurrency(report.total_expense)}</h3>
            </div>
            <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 text-danger flex justify-center items-center rounded-xl font-bold text-xl">-</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribusi Pengeluaran</h3>
          <div className="h-64 flex justify-center">
            {catNames.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="text-gray-400 text-sm flex items-center">Belum ada data</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary"/> Rincian Transaksi
          </h3>
          <div className="space-y-3">
             {report.transactions && report.transactions.length > 0 ? report.transactions.map(t => (
                <div key={t.id} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                   <div>
                     <span className="font-semibold dark:text-white">{t.category}</span>
                     <p className="text-xs text-gray-500 mt-1">{t.date} • {t.note}</p>
                   </div>
                   <div className={`font-bold ${t.type === 'income' ? 'text-secondary' : 'text-danger'}`}>
                     {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                   </div>
                </div>
             )) : (
               <div className="text-center text-gray-400 py-10">Tidak ada transaksi di bulan ini.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
