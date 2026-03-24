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
import { TrendingUp, TrendingDown, CreditCard, Activity, Landmark, Banknote, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import GlobalFilter from '../components/GlobalFilter';
import { isCurrentWeek, isCurrentMonth } from '../utils/dateUtils';

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
  const [filterType, setFilterType] = useState('monthly'); // 'weekly' or 'monthly'

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
          
          let lifetimeIncome = 0;
          let lifetimeExpense = 0;
          let monthlyIncome = 0;
          let monthlyExpense = 0;
          const catEx = {};
          
          transList.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            const isMatch = filterType === 'weekly' 
              ? isCurrentWeek(t.date) 
              : isCurrentMonth(t.date);
            
            if (t.type === 'income') {
              lifetimeIncome += amt;
              if (isMatch) monthlyIncome += amt;
            } else {
              lifetimeExpense += amt;
              if (isMatch) {
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
            balance: 0, total_income: 0, total_expense: 0, category_expenses: {}, transactions: []
          });
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, filterType]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const calculateSplits = () => {
    let cashFlow = 0;
    let bankFlow = 0;
    if (report.transactions) {
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
  const catNames = Object.keys(report.category_expenses || {});
  const catVals = Object.values(report.category_expenses || {});

  const doughnutData = {
    labels: catNames,
    datasets: [{
      data: catVals,
      backgroundColor: ['#4F46E5', '#10B981', '#E11D48', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const barData = {
    labels: ['Income', 'Expense'],
    datasets: [{
      label: filterType === 'weekly' ? 'Minggu Ini' : 'Bulan Ini',
      data: [report.total_income, report.total_expense],
      backgroundColor: ['#10B981', '#E11D48'],
      borderRadius: 12,
      barThickness: 40,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: '600' } } },
      y: { beginAtZero: true, grid: { borderDash: [5, 5] } }
    }
  };

  const getLargestCategory = () => {
    if (catNames.length === 0) return "Belum ada data";
    const maxVal = Math.max(...catVals);
    const index = catVals.indexOf(maxVal);
    const percentage = Math.round((maxVal / report.total_expense) * 100) || 0;
    return `${catNames[index]} (${percentage}%)`;
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium tracking-tight">Halo! Cek performa keuangan {filterType === 'weekly' ? 'mingguan' : 'bulanan'} kamu di sini.</p>
        </div>
        <GlobalFilter activeFilter={filterType} onFilterChange={setFilterType} />
      </header>

      {/* Smart Insight Banner */}
      {report.total_expense > 0 && (
        <div className="bg-primary rounded-3xl p-6 shadow-xl shadow-primary/20 text-white flex items-center gap-5 border border-white/10 animate-fade-in-up">
          <div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-md">
            <Activity size={28} />
          </div>
          <div>
            <h4 className="font-bold text-lg">Smart Insight</h4>
            <p className="text-sm font-medium text-white/90">
               Pengeluaran kamu {filterType === 'weekly' ? 'minggu' : 'bulan'} ini Rp {formatCurrency(report.total_expense)}, dan kategori terbesarmu adalah <b className="text-white underline decoration-emerald-400 underline-offset-4">{getLargestCategory()}</b>. Tetap bijak dalam berbelanja!
            </p>
          </div>
        </div>
      )}

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary rounded-[2rem] p-8 shadow-2xl shadow-primary/20 text-white flex justify-between items-center relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
           <div className="relative z-10">
             <p className="text-indigo-100/80 mb-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><Landmark size={16}/> Saldo Bank & E-Wallet</p>
             <h2 className="text-4xl font-black tracking-tighter">Rp {formatCurrency(splits.bank)}</h2>
           </div>
           <div className="bg-white/15 p-5 rounded-2xl backdrop-blur-md relative z-10">
             <CreditCard size={36} />
           </div>
        </div>
        
        <div className="bg-secondary rounded-[2rem] p-8 shadow-2xl shadow-secondary/20 text-white flex justify-between items-center relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
           <div className="relative z-10">
             <p className="text-emerald-50/80 mb-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><Banknote size={16}/> Uang Tunai (Cash)</p>
             <h2 className="text-4xl font-black tracking-tighter">Rp {formatCurrency(splits.cash)}</h2>
           </div>
           <div className="bg-white/15 p-5 rounded-2xl backdrop-blur-md relative z-10">
             <TrendingUp size={36} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Balance" value={`Rp ${formatCurrency(report.balance)}`} icon={<Activity size={24} />} type="primary" subtitle="Sisa seluruh aset" />
        <StatCard title={`Total Income (${filterType === 'weekly' ? 'Week' : 'Month'})`} value={`Rp ${formatCurrency(report.total_income)}`} icon={<TrendingUp size={24} />} type="success" subtitle={`${filterType === 'weekly' ? 'Minggu' : 'Bulan'} ini`} />
        <StatCard title={`Total Expense (${filterType === 'weekly' ? 'Week' : 'Month'})`} value={`Rp ${formatCurrency(report.total_expense)}`} icon={<TrendingDown size={24} />} type="danger" subtitle={`${filterType === 'weekly' ? 'Minggu' : 'Bulan'} ini`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">Arus Kas</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <span className="text-[10px] font-black uppercase tracking-tighter text-stone-400">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-danger"></div>
                <span className="text-[10px] font-black uppercase tracking-tighter text-stone-400">Expense</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-darkbg p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800">
          <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight mb-8">Kategori Pengeluaran</h3>
          <div className="h-[300px] flex items-center justify-center relative">
            {catNames.length > 0 ? (
              <Doughnut data={doughnutData} options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'right', labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 11 } } } } }} />
            ) : (
              <div className="text-stone-400 italic font-medium">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-darkbg rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
        <div className="p-8 border-b border-stone-50 dark:divide-stone-900 flex justify-between items-center">
          <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">Transaksi Terakhir</h3>
          <NavLink to="/income" className="text-sm font-bold text-primary hover:underline">Lihat Semua</NavLink>
        </div>
        {report.transactions && report.transactions.length > 0 ? (
          <div className="divide-y divide-stone-50 dark:divide-stone-900 transition-colors">
            {report.transactions.slice(0, 5).map((t, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors dark:hover:bg-stone-900/50">
                <div className="flex items-center gap-5">
                  <div className={`p-3.5 rounded-2xl ${t.type === 'income' ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 dark:text-white">{t.note || (t.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}</p>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black tracking-tight ${t.type === 'income' ? 'text-secondary' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}Rp {formatCurrency(t.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">{t.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-stone-400 italic font-bold">Belum ada transaksi terbaru.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
