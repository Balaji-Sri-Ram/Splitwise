import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2, Clock, CheckCircle2, UserPlus, CreditCard } from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const [stats, setStats] = useState({ groupsCount: 0, totalOwedToYou: 0, totalYouOwe: 0 });
  const [activities, setActivities] = useState([
    { id: 1, text: 'You paid ₹150 for "Dinner" in Trip to Goa', time: '2 hours ago', type: 'expense' },
    { id: 2, text: 'John added you to group "Weekend Getaway"', time: '5 hours ago', type: 'group' },
    { id: 3, text: 'Alice settled up ₹500 with you', time: '1 day ago', type: 'settlement' },
  ]);
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

  const handleClearActivities = () => {
    setActivities([]);
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'expense': return <CreditCard className="w-5 h-5 text-accent" />;
      case 'group': return <UserPlus className="w-5 h-5 text-primary" />;
      case 'settlement': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Clock className="w-5 h-5 text-graphite" />;
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-graphite">Welcome back to your split summary.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft transition-transform hover:-translate-y-1 duration-300">
          <p className="text-sm font-medium text-graphite mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-charcoal">₹{stats.totalOwedToYou.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft transition-transform hover:-translate-y-1 duration-300">
          <p className="text-sm font-medium text-graphite mb-1">You Owe</p>
          <p className="text-2xl font-bold text-accent">₹{stats.totalYouOwe.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-soft transition-transform hover:-translate-y-1 duration-300">
          <p className="text-sm font-medium text-graphite mb-1">Active Groups</p>
          <p className="text-2xl font-bold text-primary-light">{stats.groupsCount}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-soft border border-border-soft p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-charcoal">Recent Activity</h2>
          {activities.length > 0 && (
            <button
              onClick={handleClearActivities}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-border-soft hover:bg-gray-50 transition-all duration-200"
              >
                <div className="p-3 rounded-full bg-white shadow-sm border border-gray-100 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-charcoal font-medium">{activity.text}</p>
                  <p className="text-xs text-graphite mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-gray-50 p-4 rounded-full mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-80" />
            </div>
            <p className="text-charcoal font-medium">All caught up!</p>
            <p className="text-graphite text-sm mt-1">No recent activities to show.</p>
          </div>
        )}
      </div>
    </div>
  );
}
