import { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, PlusCircle, Trash2, ReceiptText, Cloud } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fmt } from '../data';
import { financeAPI } from '../services/api';
import { expensesDB } from '../services/offlineDB';
import { smartAction } from '../services/syncQueue';
import { notifySuccess } from '../services/notificationService';
import api from '../services/api';

const EXPENSE_CATEGORIES = [
  { key: 'feed',     label: 'Feed & Fodder', emoji: '🌾' },
  { key: 'vet',      label: 'Veterinary',    emoji: '💉' },
  { key: 'labor',    label: 'Labor',         emoji: '👷' },
  { key: 'medicine', label: 'Medicine',      emoji: '💊' },
  { key: 'other',    label: 'Other',         emoji: '📦' },
];

export default function Finance() {
  const { db, update, isOnline } = useApp();
  const fin = db.finance;
  const [price, setPrice]   = useState(fin.pricePerLitre);
  const [feed, setFeed]     = useState(fin.feedCostPerCowPerDay);
  const [other, setOther]   = useState(fin.otherCostPerDay);
  const [expCategory, setExpCategory] = useState('feed');
  const [expAmount,   setExpAmount]   = useState('');
  const [expDate,     setExpDate]     = useState(new Date().toISOString().split('T')[0]);
  const [expNotes,    setExpNotes]    = useState('');
  const [expenses,    setExpenses]    = useState([]);
  const [expLoading,  setExpLoading]  = useState(false);
  const [backendSummary, setBackendSummary] = useState(null);

  const today      = new Date().toISOString().split('T')[0];
  const monthStart = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
  const activeCows = db.cattle.filter(c => c.lactation > 0).length;
  const todayL  = db.milkLog.filter(m => m.date === today).reduce((s, m) => s + m.total, 0);
  const monthL  = db.milkLog.filter(m => m.date >= monthStart).reduce((s, m) => s + m.total, 0);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const ds = dt.toISOString().split('T')[0];
    const r  = db.milkLog.filter(m => m.date === ds).reduce((s, m) => s + m.total, 0) * price;
    days.push({ lbl: dt.toLocaleDateString('en-IN', { weekday: 'short' }), val: Math.round(r) });
  }
  const maxV = Math.max(...days.map(d => d.val), 1);

  useEffect(() => {
    expensesDB.getAll().then(rows => setExpenses(rows.sort((a, b) => b.date.localeCompare(a.date))));
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    financeAPI.summary().then(r => setBackendSummary(r.data)).catch(() => {});
  }, [isOnline]);

  const monthExpenses    = expenses.filter(e => e.date >= monthStart);
  const totalLocalExp    = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthCost        = (feed * activeCows + other) * 30;

  const displayRevenue  = backendSummary?.monthRevenue  ?? (monthL * price);
  const displayExpenses = (backendSummary?.totalExpenses ?? totalLocalExp) || monthCost;
  const displayProfit   = displayRevenue - displayExpenses;
  const displayTodayRev = backendSummary?.todayRevenue  ?? (todayL * price);

  const saveSettings = () => {
    update(d => { d.finance = { pricePerLitre: +price, feedCostPerCowPerDay: +feed, otherCostPerDay: +other }; return d; });
    if (isOnline) api.put('/finance/config', { pricePerLitre: +price, feedCostPerCowPerDay: +feed, otherCostPerDay: +other }).catch(() => {});
    notifySuccess('Settings saved');
  };

  const addExpense = async () => {
    if (!expAmount || +expAmount <= 0) return;
    const item = { id: Date.now(), clientId: `EXP-${Date.now()}`, category: expCategory, amount: +expAmount, date: expDate, notes: expNotes };
    setExpLoading(true);
    await expensesDB.upsert(item);
    await smartAction('ADD_EXPENSE', 'expense', item, (d) => financeAPI.addExpense(d));
    const updated = await expensesDB.getAll();
    setExpenses(updated.sort((a, b) => b.date.localeCompare(a.date)));
    setExpAmount(''); setExpNotes(''); setExpLoading(false);
    notifySuccess(`₹${item.amount} expense logged`);
  };

  const deleteExpense = async (id) => {
    await expensesDB.remove(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Today's Revenue",  v: fmt(displayTodayRev), c: 'text-green-600', Icon: TrendingUp },
          { l: 'Monthly Revenue',  v: fmt(displayRevenue),  c: 'text-blue-600',  Icon: TrendingUp },
          { l: 'Monthly Expenses', v: fmt(displayExpenses), c: 'text-red-500',   Icon: TrendingDown },
          { l: 'Net Profit', v: fmt(displayProfit), c: displayProfit >= 0 ? 'text-green-600' : 'text-red-600', Icon: displayProfit >= 0 ? TrendingUp : TrendingDown },
        ].map(x => (
          <div key={x.l} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{x.l}</p>
              <x.Icon size={14} className={x.c} />
            </div>
            <p className={`text-xl font-bold ${x.c}`}>{x.v}</p>
            {backendSummary && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Cloud size={9}/>Synced</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Revenue</h3>
          <div className="flex items-end gap-2 h-24">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-medium">₹{d.val}</span>
                <div className="w-full rounded-t" style={{ height: `${Math.max(4, Math.round((d.val / maxV) * 72))}px`, background: 'linear-gradient(to top,#16a34a,#22c55e)', opacity: 0.85 }} />
                <span className="text-[10px] text-gray-400">{d.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Price Settings</h3>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Milk Price (₹/L)</label>
              <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} min="10" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Feed Cost/Cow/Day (₹)</label>
              <input className="input" type="number" value={feed} onChange={e => setFeed(e.target.value)} min="50" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Other Daily Costs (₹)</label>
              <input className="input" type="number" value={other} onChange={e => setOther(e.target.value)} min="0" /></div>
            <button onClick={saveSettings} className="btn-primary w-full justify-center mt-2"><Save size={15} />Save Settings</button>
          </div>
        </div>
      </div>

      {/* Expense Tracker */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <ReceiptText size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Expense Tracker</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Category totals */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EXPENSE_CATEGORIES.map(cat => {
              const total = monthExpenses.filter(e => e.category === cat.key).reduce((s, e) => s + Number(e.amount), 0);
              return (
                <div key={cat.key} className="text-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-lg mb-1">{cat.emoji}</div>
                  <p className="text-[10px] font-semibold text-gray-600">{cat.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">₹{total.toLocaleString('en-IN')}</p>
                </div>
              );
            })}
          </div>

          {/* Log expense form */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Log Expense</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select className="select" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                <input className="input" type="number" placeholder="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} min="1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input className="input" type="date" value={expDate} onChange={e => setExpDate(e.target.value)} max={today} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input className="input" placeholder="optional" value={expNotes} onChange={e => setExpNotes(e.target.value)} />
              </div>
            </div>
            <button onClick={addExpense} disabled={expLoading || !expAmount} className="btn-primary w-full justify-center">
              <PlusCircle size={15} /> {expLoading ? 'Saving…' : 'Log Expense'}
            </button>
          </div>

          {/* Recent expenses */}
          {expenses.slice(0, 20).map(e => {
            const cat = EXPENSE_CATEGORIES.find(c => c.key === e.category) || EXPENSE_CATEGORIES[4];
            return (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                <span className="text-lg">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{cat.label}</p>
                  {e.notes && <p className="text-xs text-gray-500 truncate">{e.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-600">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-400">{e.date}</p>
                </div>
                <button onClick={() => deleteExpense(e.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per Cow Profitability */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Per Cow Profitability (30 days)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100">
              <th className="px-5 py-3 text-left">Cattle</th><th className="px-4 py-3 text-left">Milk</th>
              <th className="px-4 py-3 text-left">Revenue</th><th className="px-4 py-3 text-left">Cost</th><th className="px-4 py-3 text-left">Profit</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {db.cattle.filter(c => c.lactation > 0).map((c, i) => {
                const ml  = db.milkLog.filter(m => m.date >= monthStart && m.cowId === c.id).reduce((s, m) => s + m.total, 0);
                const rev = ml * price; const cost = (feed * 30) + (other / (activeCows || 1) * 30); const profit = rev - cost;
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{ml.toFixed(1)}L</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmt(rev)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(cost)}</td>
                    <td className={`px-4 py-3 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
