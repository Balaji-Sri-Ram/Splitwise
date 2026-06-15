import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Receipt, Plus, X, Users, ArrowRight } from 'lucide-react';
import ExpenseChat from '../components/ExpenseChat';
import { useLocation } from 'react-router-dom';

export default function Expenses() {
  const { user, socket } = useAuthStore();
  const location = useLocation();
  const passedGroupId = location.state?.groupId;
  
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseForChat, setSelectedExpenseForChat] = useState(null);
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, UNEQUAL, PERCENTAGE, SHARE
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  
  const amountStr = watch('amount');
  const amount = Number(amountStr) || 0;

  // Manual split state when not EQUAL
  const [manualSplits, setManualSplits] = useState({});

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchExpenses();
      fetchBalances();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (socket && selectedGroup) {
      const handleNewExpense = (expense) => {
        setExpenses((prev) => [expense, ...prev]);
      };
      const handleBalancesUpdated = () => {
        fetchBalances();
      };

      socket.on('new_expense', handleNewExpense);
      socket.on('balances_updated', handleBalancesUpdated);

      return () => {
        socket.off('new_expense', handleNewExpense);
        socket.off('balances_updated', handleBalancesUpdated);
      };
    }
  }, [socket, selectedGroup]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
      if (res.data.length > 0) {
        if (passedGroupId) {
          const matchedGroup = res.data.find(g => g.id === passedGroupId);
          setSelectedGroup(matchedGroup || res.data[0]);
        } else {
          setSelectedGroup(res.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses/group/${selectedGroup.id}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await api.get(`/groups/${selectedGroup.id}/balances`);
      setBalances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSplitChange = (memberId, value) => {
    setManualSplits(prev => ({
      ...prev,
      [memberId]: Number(value) || 0
    }));
  };

  const onCreateExpense = async (data) => {
    try {
      const members = selectedGroup.members;
      let splits = [];

      if (splitType === 'EQUAL') {
        const splitAmount = (amount / members.length).toFixed(2);
        // adjust last person for rounding issues
        let sum = 0;
        splits = members.map((m, i) => {
          let val = Number(splitAmount);
          if (i === members.length - 1) {
            val = amount - sum; // give remainder to last
          } else {
            sum += val;
          }
          return { userId: m.userId, amount: Number(val.toFixed(2)), type: 'EQUAL' };
        });
      } else if (splitType === 'UNEQUAL') {
        splits = members.map(m => ({
          userId: m.userId,
          amount: manualSplits[m.userId] || 0,
          type: 'UNEQUAL'
        }));
      } else if (splitType === 'PERCENTAGE') {
        splits = members.map(m => ({
          userId: m.userId,
          amount: Number(((manualSplits[m.userId] || 0) / 100 * amount).toFixed(2)),
          type: 'PERCENTAGE'
        }));
      } else if (splitType === 'SHARE') {
        const totalShares = Object.values(manualSplits).reduce((a, b) => a + b, 0) || 1;
        splits = members.map(m => ({
          userId: m.userId,
          amount: Number((((manualSplits[m.userId] || 0) / totalShares) * amount).toFixed(2)),
          type: 'SHARE'
        }));
      }

      const payload = {
        groupId: selectedGroup.id,
        title: data.title,
        amount: amount,
        paidById: user.id, // currently always paid by logged in user for simplicity
        category: data.category || 'General',
        splits
      };

      await api.post('/expenses', payload);
      setIsModalOpen(false);
      reset();
      setManualSplits({});
      fetchExpenses();
      fetchBalances();
    } catch (err) {
      console.error('Failed to create expense', err);
      alert(err.response?.data?.error || 'Failed to create expense');
    }
  };

  const handleSettleDebts = async () => {
    try {
      if (balances.length === 0) return;
      // For MVP, we auto-settle the first debt involving the current user.
      const debt = balances.find(d => d.fromUser?.id === user.id || d.toUser?.id === user.id);
      if (!debt) {
        alert('You have no direct debts to settle right now.');
        return;
      }
      
      const payload = {
        groupId: selectedGroup.id,
        receiverId: debt.fromUser?.id === user.id ? debt.toUser?.id : debt.fromUser?.id,
        amount: debt.amount
      };
      
      await api.post('/payments', payload);
      fetchExpenses();
      fetchBalances();
      alert('Debt successfully settled!');
    } catch (err) {
      console.error(err);
      alert('Failed to settle debt.');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Expenses</h1>
          <p className="text-graphite mt-1">Track shared costs and settlements.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-white border border-border-soft rounded-lg text-sm text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={selectedGroup?.id || ''}
            onChange={(e) => setSelectedGroup(groups.find(g => g.id === e.target.value))}
          >
            {groups.length === 0 && <option value="">No Groups</option>}
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedGroup}
            className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {!selectedGroup ? (
        <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-12 text-center text-graphite">
          Please select or create a group first.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Expenses List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
              <Receipt size={20} className="text-primary" />
              Recent Expenses
            </h2>
            {expenses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-8 text-center text-graphite text-sm">
                No expenses recorded yet.
              </div>
            ) : (
              expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  onClick={() => setSelectedExpenseForChat(expense)}
                  className="bg-white rounded-xl shadow-soft border border-border-soft p-5 flex justify-between items-center hover:bg-bg-card/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {expense.category?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <h4 className="font-bold text-charcoal text-sm">{expense.title}</h4>
                      <p className="text-xs text-graphite mt-1">Paid by {expense.paidBy.id === user.id ? 'You' : expense.paidBy.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-charcoal">₹{expense.amount.toFixed(2)}</div>
                    <div className="text-xs text-graphite mt-1">{new Date(expense.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar: Balances */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
              <Users size={20} className="text-accent" />
              Balances
            </h2>
            <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-5">
              {balances.length === 0 ? (
                <div className="text-center text-graphite text-sm py-4">
                  All settled up!
                </div>
              ) : (
                <div className="space-y-4">
                  {balances.map((debt, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal truncate max-w-[80px]" title={debt.fromUser?.name}>
                          {debt.fromUser?.id === user.id ? 'You' : debt.fromUser?.name}
                        </span>
                        <ArrowRight size={14} className="text-graphite flex-shrink-0" />
                        <span className="font-medium text-charcoal truncate max-w-[80px]" title={debt.toUser?.name}>
                          {debt.toUser?.id === user.id ? 'You' : debt.toUser?.name}
                        </span>
                      </div>
                      <div className="font-bold text-accent">
                        ₹{debt.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {balances.length > 0 && (
              <button 
                onClick={handleSettleDebts}
                className="w-full bg-bg-card hover:bg-border-soft text-charcoal font-medium py-2.5 rounded-lg transition-colors border border-border-soft text-sm"
              >
                Settle Debts
              </button>
            )}
          </div>

        </div>
      )}

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft border border-border-soft w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border-soft flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                Add an Expense <span className="text-xs font-normal text-graphite bg-bg-base px-2 py-1 rounded">in {selectedGroup?.name}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-graphite hover:text-charcoal transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="expenseForm" onSubmit={handleSubmit(onCreateExpense)} className="space-y-5">
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-graphite mb-1">Description</label>
                    <input
                      {...register('title', { required: 'Required' })}
                      type="text"
                      className="w-full px-4 py-2 text-sm border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-bg-base"
                      placeholder="e.g. Dinner at Mario's"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-medium text-graphite mb-1">Amount (₹)</label>
                    <input
                      {...register('amount', { required: 'Required', min: 0.01 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 text-sm border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-bg-base text-right font-bold text-charcoal"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border-soft">
                  <label className="block text-xs font-medium text-graphite mb-2">Split Strategy</label>
                  <div className="flex bg-bg-base p-1 rounded-lg border border-border-soft text-xs font-medium text-center">
                    {['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSplitType(type)}
                        className={`flex-1 py-1.5 rounded-md transition-all ${splitType === type ? 'bg-white shadow-sm text-primary border border-border-soft' : 'text-graphite hover:text-charcoal'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Configuration */}
                {selectedGroup && splitType !== 'EQUAL' && (
                  <div className="bg-bg-base border border-border-soft rounded-lg p-4 space-y-3">
                    <div className="text-xs text-graphite mb-2">
                      {splitType === 'UNEQUAL' && 'Enter exact amounts for each person.'}
                      {splitType === 'PERCENTAGE' && 'Enter percentages (must total 100%).'}
                      {splitType === 'SHARE' && 'Enter relative shares (e.g., 2 shares for A, 1 for B).'}
                    </div>
                    {selectedGroup.members.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-charcoal truncate">{member.user.name}</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            step={splitType === 'PERCENTAGE' ? '1' : '0.01'}
                            value={manualSplits[member.userId] || ''}
                            onChange={(e) => handleManualSplitChange(member.userId, e.target.value)}
                            className="w-full pl-2 pr-6 py-1 text-sm border border-border-soft rounded focus:outline-none focus:border-primary text-right"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-graphite pointer-events-none">
                            {splitType === 'PERCENTAGE' ? '%' : splitType === 'UNEQUAL' ? '₹' : 'x'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {splitType === 'EQUAL' && amount > 0 && selectedGroup && (
                  <div className="text-center text-sm text-graphite p-4 bg-bg-base rounded-lg border border-border-soft">
                    Everyone owes <strong>₹{(amount / selectedGroup.members.length).toFixed(2)}</strong>
                  </div>
                )}

              </form>
            </div>
            
            <div className="p-6 border-t border-border-soft shrink-0 bg-bg-base/50">
              <button
                type="submit"
                form="expenseForm"
                className="w-full bg-primary hover:bg-primary-light text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expense Chat Panel */}
      {selectedExpenseForChat && (
        <ExpenseChat 
          expense={selectedExpenseForChat} 
          onClose={() => setSelectedExpenseForChat(null)} 
        />
      )}
    </div>
  );
}
