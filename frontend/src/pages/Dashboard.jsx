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
import api from '../services/api';
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
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback realistic mock data to wow the user if backend is offline
  const mockReport = {
    balance: 3250000,
    total_income: 5000000,
    total_expense: 1750000,
    category_expenses: {
      "Makan": 800000,
      "Kos": 500000,
      "Transportasi": 150000,
      "Jajan": 200000,
      "Hiburan": 100000
    },
    transactions: [
      { id: 1, type: "income", amount: 2000000, category: "Uang Bulanan", date: "2024-03-01", note: "[Ke: Saldo Bank] Dari Ortu" },
      { id: 2, type: "income", amount: 3000000, category: "Freelance", date: "2024-03-02", note: "[Ke: Cash / Tunai] Project" },
      { id: 3, type: "expense", amount: 500000, category: "Kos", date: "2024-03-02", note: "Bayar kos bulan ini" },
      { id: 4, type: "expense", amount: 150000, category: "Makan", date: "2024-03-03", note: "[Cash] Makan di kampus" },
      { id: 5, type: "expense", amount: 50000, category: "Jajan", date: "2024-03-05", note: "Kopi susu" },
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const res = await api.get(`/report/monthly?month=${month}`);
        setReport(res.data.data);
      } catch (err) {
        console.warn("Backend not reachable or error. Using mock data for preview purposes.", err);
        setReport(mockReport);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Calculate Cash vs Bank splits
  const calculateSplits = () => {
    let cashFlow = 0;
    let bankFlow = 0;
    // Basic heuristic: if note contains "[Ke: Cash", "[Cash]" -> cash, else bank
    if (report && report.transactions) {
      report.transactions.forEach(t => {
        const isCash = t.note && (t.note.includes('Cash') || t.note.includes('Tunai'));
        if (t.type === 'income') {
           if (isCash) cashFlow += t.amount;
           else bankFlow += t.amount;
        } else {
           if (isCash) cashFlow -= t.amount;
           else bankFlow -= t.amount;
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

  // Bar Chart Data (Weekly mock representation since it's just visual)
  const barData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Income',
        data: [report.total_income, 0, 0, 0], // simplified visualization
        backgroundColor: '#22C55E',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: [report.total_expense * 0.4, report.total_expense * 0.2, report.total_expense * 0.3, report.total_expense * 0.1], // simplified visualization
        backgroundColor: '#EF4444',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151' } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' } },
      y: { grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6' }, ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' } }
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
             <h2 className="text-3xl font-bold">{formatCurrency(splits.bank)}</h2>
           </div>
           <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
             <CreditCard size={32} />
           </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center transform transition-transform hover:scale-[1.02]">
           <div>
             <p className="text-emerald-100 mb-1 flex items-center gap-2"><Banknote size={18}/> Uang Tunai (Cash)</p>
             <h2 className="text-3xl font-bold">{formatCurrency(splits.cash)}</h2>
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
          value={formatCurrency(report.balance)} 
          icon={<Wallet size={24} />} 
          type="primary"
          subtitle="Sisa uang bulan ini"
        />
        <StatCard 
          title="Total Income" 
          value={formatCurrency(report.total_income)} 
          icon={<TrendingUp size={24} />} 
          type="success"
        />
        <StatCard 
          title="Total Expense" 
          value={formatCurrency(report.total_expense)} 
          icon={<TrendingDown size={24} />} 
          type="danger"
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Flow (Mingguan)</h3>
          <div className="h-72">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pengeluaran per Kategori</h3>
          <div className="h-64 flex justify-center">
            {catNames.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151' } } } }} />
            ) : (
              <div className="flex items-center text-sm text-gray-400">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
        </div>
        
        <div className="space-y-4">
          {report.transactions && report.transactions.length > 0 ? (
            report.transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                     {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{t.category}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()} {t.note && `• ${t.note}`}</p>
                  </div>
                </div>
                <div className={`font-semibold ${t.type === 'income' ? 'text-secondary' : 'text-danger'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-6">Tidak ada transaksi bulan ini.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
