import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  HeartHandshake, 
  LayoutDashboard, 
  ListOrdered, 
  PlusCircle, 
  LineChart, 
  Bell, 
  UserCircle,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Layout() {
  const { signOut, user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Listings', path: '/manage-listings', icon: ListOrdered },
    { name: 'Create Listing', path: '/create-listing', icon: PlusCircle },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: 3 },
    { name: 'Profile & Settings', path: '/profile', icon: UserCircle },
  ];

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-gray-950 flex flex-col hidden md:flex h-full flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <HeartHandshake className="w-6 h-6 text-primary" />
            <span>FoodBridge</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={twMerge(
                  clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  )
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-900 rounded-md">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
              {user?.email?.charAt(0) || 'D'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.email || 'Donor'}</span>
              <span className="text-xs text-primary font-medium">Verified Donor</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full h-full flex flex-col">
        {/* Mobile Header */}
        <header className="h-16 border-b bg-white dark:bg-gray-950 flex items-center px-4 md:hidden justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <HeartHandshake className="w-5 h-5" />
            <span>FoodBridge</span>
          </div>
          <button className="text-gray-500 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>

        {/* Dynamic page content */}
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
