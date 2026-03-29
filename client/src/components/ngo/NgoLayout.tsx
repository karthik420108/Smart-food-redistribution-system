import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, ClipboardList, MapPin, Users, BarChart3,
  Building2, Settings, Bell, ChevronLeft, ChevronRight, LogOut,
  Menu, FileText, Activity, HelpCircle, Zap
} from 'lucide-react';

import { supabase } from '../../lib/supabase';
import { useNgoStore } from '../../store/ngoStore';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/ngo' },
  { label: 'Discover Food', icon: Search, path: '/ngo/discover' },
  { label: 'My Claims', icon: ClipboardList, path: '/ngo/claims' },
  { label: 'Task Board', icon: Zap, path: '/ngo/tasks', highlight: true },
  { label: 'Live Tracking', icon: MapPin, path: '/ngo/tracking' },
  { label: 'Volunteers', icon: Users, path: '/ngo/volunteers' },
  { label: 'Impact', icon: BarChart3, path: '/ngo/impact' },
  { label: 'Reports', icon: FileText, path: '/ngo/reports' },
  { label: 'NGO Profile', icon: Building2, path: '/ngo/profile' },
  { label: 'Settings', icon: Settings, path: '/ngo/settings' },
  { label: 'Notifications', icon: Bell, path: '/ngo/notifications' },
  { label: 'Activity Log', icon: Activity, path: '/ngo/activity' },
];

export function NgoLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { ngo, fetchNgo } = useNgoStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchNgo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">FB</span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-white">FoodBridge</div>
            <div className="text-xs text-teal-400">NGO Portal</div>
          </div>
        )}
      </div>

      {/* NGO Identity */}
      {!collapsed && ngo && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-gray-400 truncate">{ngo.org_name}</div>
          <div className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            ngo.status === 'verified' ? 'bg-green-500/20 text-green-400' :
            ngo.status === 'pending_verification' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {ngo.status === 'verified' ? 'Verified' : ngo.status === 'pending_verification' ? 'Pending' : ngo.status}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.path === '/ngo' 
            ? location.pathname === '/ngo' 
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/ngo'}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                isActive
                  ? 'bg-teal-500/20 text-teal-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              {item.highlight && !isActive && (
                <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col flex-shrink-0 relative border-r border-white/5"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white shadow-lg"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex items-center gap-4 px-4 border-b border-white/5 bg-gray-950 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {/* Quick stats strip */}
          {ngo?.status === 'verified' && (
            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
              <span>{ngo.total_tasks_completed} tasks</span>
              <span className="text-gray-700">|</span>
              <span>{ngo.total_kg_received.toFixed(0)} kg collected</span>
              <span className="text-gray-700">|</span>
              <span className="text-green-400">★ {ngo.rating.toFixed(1)}</span>
            </div>
          )}
          <button
            onClick={() => navigate('/ngo/notifications')}
            className="relative p-2 text-gray-400 hover:text-white"
          >
            <Bell size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
            {ngo?.contact_person?.[0] || 'N'}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-950">
          {ngo?.status === 'pending_verification' ? (
            <PendingVerificationScreen ngo={ngo} />
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function PendingVerificationScreen({ ngo }: { ngo: any }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
          <HelpCircle size={36} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Account Under Review</h1>
          <p className="text-gray-400">
            Your NGO application has been submitted and is being reviewed by our team.
            You'll receive an email notification once approved.
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-5 text-left space-y-3 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Organization</span>
            <span className="text-white font-medium">{ngo.org_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Submitted</span>
            <span className="text-white">{new Date(ngo.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Status</span>
            <span className="text-amber-400 font-medium">Pending Verification</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Expected Review</span>
            <span className="text-white">24–48 hours</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Need help? Contact <a href="mailto:support@foodbridge.in" className="text-teal-400 hover:underline">support@foodbridge.in</a>
        </p>
      </div>
    </div>
  );
}


