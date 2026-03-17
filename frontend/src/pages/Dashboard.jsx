import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Activity, Landmark, Banknote } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState({
    balance: 0,
    total_income: 0,
    total_expense: 0,
    category_expenses: {},
    transactions: []
  });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const transactionsRef = ref(db, `transactions/${user?.id || user?.uid}`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const transList = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => {
              const dateA = a.date ? new Date(a.date) : 0;
              const dateB = b.date ? new Date(b.date) : 0;
              return dateB - dateA;
            });
          
          const today = new Date();
          const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          
          // Calculate stats
          let lifetimeIncome = 0;
          let lifetimeExpense = 0;
          let monthlyIncome = 0;
          let monthlyExpense = 0;
          const catEx = {};
          
          transList.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            const isCurrentMonth = t.date && t.date.startsWith(currentMonth);
            
            if (t.type === 'income') {
              lifetimeIncome += amt;
              if (isCurrentMonth) monthlyIncome += amt;
            } else {
              lifetimeExpense += amt;
              if (isCurrentMonth) {
                monthlyExpense += amt;
                if (t.category) {
                  catEx[t.category] = (catEx[t.category] || 0) + amt;
                }
              }
            }
          });

          setReport({
            balance: lifetimeIncome - lifetimeExpense,
            total_income: monthlyIncome,
            total_expense: monthlyExpense,
            category_expenses: catEx,
            transactions: transList
          });
        } else {
          setReport({
            balance: 0,
            total_income: 0,
            total_expense: 0,
            category_expenses: {},
            transactions: []
          });
        }
      } catch (err) {
        console.error("CRITICAL ERROR in Dashboard listener:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Firebase Dashboard error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Calculate Cash vs Bank splits
  const calculateSplits = () => {
    let cashFlow = 0;
    let bankFlow = 0;
    if (report && report.transactions) {
      report.transactions.forEach(t => {
        const isCash = t.note && (t.note.includes('Cash') || t.note.includes('Tunai'));
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
           if (isCash) cashFlow += amt;
           else bankFlow += amt;
        } else {
           if (isCash) cashFlow -= amt;
           else bankFlow -= amt;
        }
      });
    }
    return { cash: Math.max(0, cashFlow), bank: Math.max(0, bankFlow) };
  };

  const splits = calculateSplits();

  // Doughnut Chart Data (Expense Categories)
  const catNames = Object.keys(report.category_expenses || {});
  const catVals = Object.values(report.category_expenses || {});
  const doughnutData = {
    labels: catNames,
    datasets: [
      {
        data: catVals,
        backgroundColor: ['#4F46E5', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  // Bar Chart Data (Daily/Weekly based on dates)
  const barData = {
    labels: ['Income', 'Expense'],
    datasets: [
      {
        label: 'Statistik',
        data: [report.total_income, report.total_expense],
        backgroundColor: ['#22C55E', '#EF4444'],
        borderRadius: 8,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }
      },
      y: { 
        beginAtZero: true,
        grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6' },
        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }
      }
    }
  };

  // Smart Insight simple calculation
  const getLargestCategory = () => {
    if (catNames.length === 0) return "Belum ada data";
    const maxVal = Math.max(...catVals);
    const index = catVals.indexOf(maxVal);
    const percentage = Math.round((maxVal / report.total_expense) * 100) || 0;
    return `${catNames[index]} (${percentage}%)`;
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Halo! Cek performa keuangan bulanan kamu di sini.</p>
      </header>

      {/* Smart Insight Banner */}
      {report.total_expense > 0 && (
        <div className="bg-indigo-600 dark:bg-primary rounded-2xl p-6 shadow-md text-white flex items-center gap-4 animate-fade-in-up">
          <div className="bg-white/20 p-3 rounded-full">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-white/90">Smart Insight</h4>
            <p className="text-sm mt-1 text-white/80">
               Pengeluaran kamu bulan ini Rp {formatCurrency(report.total_expense)}, dan kategori pengeluaran terbesarmu adalah <b>{getLargestCategory()}</b>. Tetap hemat ya!
            </p>
          </div>
        </div>
      )}

      {/* Wallet Splitting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.02]">
           <div>
             <p className="text-indigo-100 mb-1 flex items-center gap-2"><Landmark size={18}/> Saldo Bank & E-Wallet</p>
             <h2 className="text-3xl font-bold">Rp {formatCurrency(splits.bank)}</h2>
           </div>
           <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
             <CreditCard size={32} />
           </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.02]">
           <div>
             <p className="text-emerald-100 mb-1 flex items-center gap-2"><Banknote size={18}/> Uang Tunai (Cash)</p>
             <h2 className="text-3xl font-bold">Rp {formatCurrency(splits.cash)}</h2>
           </div>
           <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
             <Wallet size={32} />
           </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Balance" 
          value={`Rp ${formatCurrency(report.balance)}`} 
          icon={<Wallet size={24} />} 
          type="primary"
          subtitle="Sisa uang bulan ini"
        />
        <StatCard 
          title="Total Income" 
          value={`Rp ${formatCurrency(report.total_income)}`} 
          icon={<TrendingUp size={24} />} 
          type="success"
        />
        <StatCard 
          title="Total Expense" 
          value={`Rp ${formatCurrency(report.total_expense)}`} 
          icon={<TrendingDown size={24} />} 
          type="danger"
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Flow (Stats)</h3>
          <div className="h-60 sm:h-72">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pengeluaran Kategori</h3>
          <div className="h-56 sm:h-64 flex justify-center">
            {catNames.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 }, color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151' } } } }} />
            ) : (
              <div className="flex items-center text-sm text-gray-400 italic">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <button className="text-primary text-sm font-medium hover:underline">Lihat Semua</button>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {report.transactions && report.transactions.length > 0 ? (
            report.transactions.slice(0, 5).map((t) => {
              try {
                return (
                  <div key={t.id} className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`p-2.5 sm:p-3 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                         {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{t.category}</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} {t.note && `• ${t.note}`}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold text-sm sm:text-base whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-secondary' : 'text-danger'}`}>
                      {t.type === 'income' ? '+Rp ' : '-Rp '}{formatCurrency(t.amount || 0)}
                    </div>
                  </div>
                );
              } catch (e) {
                return null;
              }
            })
          ) : (
            <div className="text-center text-gray-500 py-10 italic text-sm">Tidak ada transaksi bulan ini.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
