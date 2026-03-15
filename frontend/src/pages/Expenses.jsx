import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const mockExpenses = [
    { id: 1, amount: 50000, category: 'Makan', payment_method: 'Cash', date: '2024-03-01', note: 'Ayam Geprek' },
    { id: 2, amount: 500000, category: 'Kos', payment_method: 'Transfer Bank', date: '2024-03-02', note: 'Bulanan' },
    { id: 3, amount: 150000, category: 'Belanja', payment_method: 'SPayLater', date: '2024-03-05', note: 'Baju' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/transactions?type=expense');
      setExpenses(res.data.data || []);
    } catch (err) {
      console.warn("Using mock expenses");
      setExpenses(mockExpenses);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const finalNote = paymentMethod !== 'Cash' ? `[${paymentMethod}] ${note}` : note;
    try {
      await api.post('/transactions', { type: 'expense', amount: parseFloat(amount), category, date, note: finalNote });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      // simulate success for mock
      const newExp = { id: Date.now(), amount: parseFloat(amount), category, date, note: finalNote };
      setExpenses([newExp, ...expenses]);
      setShowForm(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchExpenses();
    } catch (err) {
      setExpenses(expenses.filter(i => i.id !== id));
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pengeluaran</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Catat dan pantau kemana saja uangmu pergi.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Tambah Pengeluaran
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Tambah Data Pengeluaran</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" onSubmit={handleAdd}>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
               <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Contoh: 150000" />
             </div>
             <div>
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option>Makan</option>
                 <option>Kos / Kontrakan</option>
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
               <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Metode Pembayaran</label>
               <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option>Cash</option>
                 <option>Transfer Bank / QRIS</option>
                 <option>SPayLater</option>
                 <option>Kredivo</option>
                 <option>GoPayLater</option>
                 <option>Lainnya</option>
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
             <div className="lg:col-span-5 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Batal</button>
                <button type="submit" className="px-4 py-2 bg-danger hover:bg-red-700 text-white rounded-md">Simpan</button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Tanggal</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Catatan/Metode</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Jumlah</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="p-4 text-sm text-gray-900 dark:text-gray-100">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-900 dark:text-gray-100">
                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    {exp.note || '-'}
                  </td>
                  <td className="p-4 text-sm font-semibold text-danger text-right">-{formatCurrency(exp.amount)}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-danger p-1 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data pengeluaran.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
