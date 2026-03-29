import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, User, MessageCircle, LogOut, Bell, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useVolunteerStore } from '../../store/volunteerStore';

const navItems = [
  { label: 'Home', icon: Home, path: '/volunteer' },
  { label: 'My Tasks', icon: ClipboardList, path: '/volunteer/tasks' },
  { label: 'Profile', icon: User, path: '/volunteer/profile' },
];

export function VolunteerLayout() {
  const { volunteer, fetchProfile, activeTask, fetchActiveTask } = useVolunteerStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchActiveTask();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/ngo/login');
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-white/5 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div>
            <div className="font-bold text-sm text-white">FoodBridge</div>
            <div className="text-xs text-orange-400">Volunteer Portal</div>
          </div>
        </div>

        {/* Profile Chip */}
        {volunteer && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-600/50 flex items-center justify-center text-white text-xs font-bold">
                {volunteer.full_name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{volunteer.full_name}</div>
                <div className={`text-xs font-medium ${
                  volunteer.availability_status === 'available' ? 'text-green-400' :
                  volunteer.availability_status === 'on_task' ? 'text-orange-400' :
                  'text-gray-500'
                } capitalize`}>{volunteer.availability_status}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const isActive = item.path === '/volunteer' ? location.pathname === '/volunteer' : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/volunteer'}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  isActive ? 'bg-orange-500/20 text-orange-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={17} />
                {item.label}
                {item.path === '/volunteer' && activeTask && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full text-sm">
            <LogOut size={17} />Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden h-14 flex items-center gap-4 px-4 border-b border-white/5 bg-gray-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 font-bold text-xs">V</span>
            </div>
            <span className="text-white font-semibold text-sm">Volunteer</span>
          </div>
          {activeTask && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
          <div className="flex-1" />
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 hover:text-white">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="md:hidden bg-gray-900 border-b border-white/5 overflow-hidden flex-shrink-0"
            >
              <div className="p-3 space-y-1">
                {navItems.map(item => (
                  <NavLink key={item.path} to={item.path} end={item.path === '/volunteer'} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'
                    }`}>
                    <item.icon size={17} />{item.label}
                  </NavLink>
                ))}
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-red-400 text-sm w-full">
                  <LogOut size={17} />Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Nav on Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-white/5 z-30 flex items-center justify-around px-4 py-2.5">
          {navItems.map(item => {
            const isActive = item.path === '/volunteer' ? location.pathname === '/volunteer' : location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path} end={item.path === '/volunteer'}
                className="flex flex-col items-center gap-1">
                <item.icon size={22} className={isActive ? 'text-orange-400' : 'text-gray-500'} />
                <span className={`text-xs ${isActive ? 'text-orange-400 font-medium' : 'text-gray-600'}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
