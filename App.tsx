import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Lock, Globe, Menu, X, LogOut } from 'lucide-react';
import ThreeBackground from './components/ThreeBackground';
import Dashboard from './components/Dashboard';
import SMSManager from './components/SMSManager';
import SecurePush from './components/SecurePush';
import * as StorageService from './services/storage';
import { DashboardStats, SMSMessage, SecureLink } from './types';

const App: React.FC = () => {
  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSms: 0,
    deliveredSms: 0,
    activeLinks: 0,
    vaultItems: 0
  });
  const [messageHistory, setMessageHistory] = useState<SMSMessage[]>([]);

  const refreshData = () => {
    const msgs = StorageService.getMessages();
    const links = StorageService.getSecureLinks();
    const vault = StorageService.getVaultItems();
    
    setMessageHistory(msgs);
    setStats({
      totalSms: msgs.length,
      deliveredSms: msgs.filter(m => m.status === 'DELIVERED').length,
      activeLinks: links.filter(l => !l.isBurned && l.views < l.maxViews).length,
      vaultItems: vault.length
    });
  };

  useEffect(() => {
    refreshData();
    // Poll for delivery updates simulation
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`
      }
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
    </NavLink>
  );

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      <ThreeBackground />

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10">
            <Globe className="w-8 h-8 text-blue-500 animate-pulse-slow" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">
              SMSGATE<span className="font-light">PUSH</span>
            </h1>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
            <NavItem to="/sms" icon={<MessageSquare className="w-5 h-5" />} label="SMS Dispatch" />
            <NavItem to="/secure" icon={<Lock className="w-5 h-5" />} label="Secure Vault" />
          </nav>

          <div className="pt-6 border-t border-slate-800">
             <div className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
               <LogOut className="w-5 h-5" />
               <span className="text-sm">Disconnect Node</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-slate-800/30 glass-panel md:bg-transparent md:backdrop-blur-none md:border-none">
           <button 
             className="md:hidden text-white"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           >
             {mobileMenuOpen ? <X /> : <Menu />}
           </button>
           
           <div className="hidden md:block text-slate-400 text-sm font-mono">
             SYSTEM_STATUS: <span className="text-green-400">ONLINE</span> | NODE: US-EAST-1
           </div>

           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
               AD
             </div>
           </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard stats={stats} messageHistory={messageHistory} />} />
              <Route path="/sms" element={<SMSManager onMessageSent={refreshData} />} />
              <Route path="/secure" element={<SecurePush onLinkCreated={refreshData} />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;