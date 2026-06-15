import { useState, useEffect } from 'react';
import api from '../services/api';

import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const [stats, setStats] = useState({ groupsCount: 0, totalOwedToYou: 0, totalYouOwe: 0 });
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/groups/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();

    if (socket) {
      socket.on('balances_updated', fetchStats);
      socket.on('new_group', fetchStats);
      return () => {
        socket.off('balances_updated', fetchStats);
        socket.off('new_group', fetchStats);
      };
    }
  }, [socket]);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-graphite">Welcome back to your split summary.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft">
          <p className="text-sm font-medium text-graphite mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-charcoal">₹{stats.totalOwedToYou.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft">
          <p className="text-sm font-medium text-graphite mb-1">You Owe</p>
          <p className="text-2xl font-bold text-accent">₹{stats.totalYouOwe.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft">
          <p className="text-sm font-medium text-graphite mb-1">Active Groups</p>
          <p className="text-2xl font-bold text-primary-light">{stats.groupsCount}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-6 h-64 flex flex-col items-center justify-center">
        <div className="text-primary opacity-50 mb-2">
          {/* Icon could go here */}
        </div>
        <p className="text-graphite text-sm">Recent activity will appear here once you add expenses.</p>
      </div>
    </div>
  );
}
