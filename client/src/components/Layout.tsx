import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  LineChart,
  Bell,
  UserCircle,
  LogOut,
  Home,
  ShieldCheck,
  Sun,
  Moon,
  HeartHandshake
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './Logo';

export function Layout() {
  const { signOut, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard',         path: '/donor',                 icon: LayoutDashboard },
    { name: 'My Listings',       path: '/donor/manage-listings',   icon: ListOrdered },
    { name: 'Create Listing',    path: '/donor/create-listing',    icon: PlusCircle },
    { name: 'Analytics',         path: '/donor/analytics',         icon: LineChart },
    { name: 'Notifications',     path: '/donor/notifications',     icon: Bell, badge: 3 },
    { name: 'Profile & Settings',path: '/donor/profile',           icon: UserCircle },
  ];

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans selection:bg-emerald-500/30 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-blue-950/30 text-gray-400' 
        : 'bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/40 text-gray-700'
    }`}>
      {/* Sidebar: Dynamic Theme Aesthetic */}
      <aside className={`w-72 flex flex-col hidden md:flex h-full flex-shrink-0 relative border-r transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-b from-slate-900/95 to-emerald-950/30 border-emerald-500/10' 
          : 'bg-gradient-to-b from-white/95 to-emerald-50/50 border-emerald-200/30'
      }`}>
        {/* Dynamic glow effect */}
        <div className={`absolute top-0 left-0 w-full h-1/2 pointer-events-none transition-opacity duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-emerald-500/10 via-blue-500/5 to-transparent' 
            : 'bg-gradient-to-b from-emerald-500/5 via-blue-500/3 to-transparent'
        }`} />
        
        <div className={`h-20 flex items-center px-8 relative z-10 transition-colors duration-300 ${
          isDark ? 'border-b border-emerald-500/10' : 'border-b border-emerald-200/30'
        }`}>
          <Link to="/donor" className="group">
            <Logo variant="donor" size="md" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 relative z-10 custom-scrollbar">
          <p className={`px-4 text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-colors duration-300 ${
            isDark ? 'text-gray-600' : 'text-gray-500'
          }`}>Main Operations</p>
          {navItems.map((item) => {
            const isActive = item.path === '/donor'
              ? location.pathname === '/donor' || location.pathname === '/donor/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={twMerge(
                  clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? isDark
                        ? "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                        : "bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-600 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : isDark
                        ? "text-gray-500 hover:bg-white/[0.05] hover:text-gray-300 border border-transparent"
                        : "text-gray-600 hover:bg-emerald-50/50 hover:text-gray-800 border border-transparent"
                  )
                )}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full transition-colors duration-300 ${
                    isDark ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-emerald-500 to-emerald-600'
                  }`} />
                )}
                <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", 
                  isActive 
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-gray-600' : 'text-gray-500'
                )} />
                <span>{item.name}</span>
                {item.badge && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg font-black animate-pulse transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black' 
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className={`p-6 relative z-10 transition-colors duration-300 ${
          isDark 
            ? 'border-t border-emerald-500/10 bg-gradient-to-t from-emerald-950/20 to-transparent' 
            : 'border-t border-emerald-200/30 bg-gradient-to-t from-emerald-50/50 to-transparent'
        }`}>
          <div className={`flex items-center gap-4 px-4 py-4 mb-4 rounded-[2rem] border relative overflow-hidden group transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/5 border-emerald-500/20' 
              : 'bg-gradient-to-r from-emerald-500/10 to-blue-500/5 border-emerald-500/30'
          }`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-emerald-500/20 via-blue-500/10 to-transparent' 
                : 'bg-gradient-to-r from-emerald-500/30 via-blue-500/20 to-transparent'
            }`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg relative z-10 transition-colors duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/40 text-emerald-400' 
                : 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 text-emerald-600'
            }`}>
              {user?.email?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="flex flex-col min-w-0 relative z-10">
              <span className={`text-[11px] font-black uppercase tracking-tight truncate transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{user?.email?.split('@')[0] || 'Donor'}</span>
              <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                <ShieldCheck size={10} />
                Verified Node
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-blue-500/20' 
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-200/30'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <Link
              to="/"
              className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Home className="w-4 h-4" />
              Switch Terminal
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'text-red-400/70 hover:bg-red-500/10 hover:text-red-300 border border-red-500/20' 
                  : 'text-red-500/70 hover:bg-red-50 hover:text-red-600 border border-red-200/30'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      </aside>

      {/* Main content: Dynamic Theme */}
      <main className={`flex-1 overflow-y-auto w-full h-full flex flex-col relative transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-emerald-950/10 to-blue-950/20' 
          : 'bg-gradient-to-br from-white via-emerald-50/20 to-blue-50/30'
      }`}>
        {/* Dynamic Top Gradient */}
        <div className={`absolute top-0 left-0 right-0 h-64 pointer-events-none transition-opacity duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-emerald-500/10 via-blue-500/5 to-transparent' 
            : 'bg-gradient-to-b from-emerald-500/5 via-blue-500/3 to-transparent'
        }`} />

        {/* Mobile Header */}
        <header className={`h-16 flex items-center px-6 md:hidden justify-between sticky top-0 z-50 transition-all duration-300 ${
          isDark 
            ? 'border-b border-emerald-500/10 bg-gradient-to-r from-slate-900/95 to-emerald-950/30 backdrop-blur-md' 
            : 'border-b border-emerald-200/30 bg-gradient-to-r from-white/95 to-emerald-50/50 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500 shadow-lg border-b-2 border-green-700">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className={`font-black tracking-tight text-xl uppercase transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Rescue</span>
              <span className="font-black tracking-tight text-xl uppercase text-green-500">Bite</span>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10 border-blue-500/20' 
                : 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200/30'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}