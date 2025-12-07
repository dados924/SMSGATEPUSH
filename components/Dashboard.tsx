import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Send, ShieldCheck, Flame, Database } from 'lucide-react';
import { DashboardStats, SMSMessage } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  messageHistory: SMSMessage[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, messageHistory }) => {
  const chartData = useMemo(() => {
    // Group messages by timestamp (simple aggregation for demo)
    const data = messageHistory.slice(0, 20).reverse().map((msg, idx) => ({
      name: idx.toString(),
      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: 1 // In a real app, this would be volume per hour
    }));
    return data.length ? data : [{ name: '0', time: 'Now', value: 0 }];
  }, [messageHistory]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Send className="w-6 h-6 text-blue-400" />} 
          title="SMS Dispatched" 
          value={stats.totalSms.toString()} 
          subValue={stats.deliveredSms > 0 ? `${((stats.deliveredSms / stats.totalSms) * 100).toFixed(0)}% Delivered` : "0% Delivered"}
        />
        <StatCard 
          icon={<Database className="w-6 h-6 text-yellow-400" />} 
          title="Vault Items" 
          value={stats.vaultItems.toString()} 
          subValue="Encrypted Entries"
        />
        <StatCard 
          icon={<ShieldCheck className="w-6 h-6 text-purple-400" />} 
          title="Active Links" 
          value={stats.activeLinks.toString()} 
          subValue="Pending Access"
        />
        <StatCard 
          icon={<Flame className="w-6 h-6 text-red-400" />} 
          title="Burned" 
          value={(stats.totalSms * 0.1 + 12).toFixed(0)} // Simulated burn metric
          subValue="Auto-Destroyed"
        />
      </div>

      <div className="glass-panel p-6 rounded-xl h-[300px] flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-blue-100 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Network Traffic
        </h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tick={{fontSize: 12}} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subValue: string }> = ({ icon, title, value, subValue }) => (
  <div className="glass-panel p-5 rounded-xl hover:bg-slate-800/50 transition-colors duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-800/80 rounded-lg">{icon}</div>
      <span className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded">{title.toUpperCase()}</span>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-400">{subValue}</div>
  </div>
);

export default Dashboard;