import { useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, Users, Receipt, LogOut } from 'lucide-react';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const socket = useAuthStore((state) => state.socket);
  const initSocket = useAuthStore((state) => state.initSocket);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user && !socket) {
      initSocket(user.id);
    }
  }, [isAuthenticated, user, socket, initSocket]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border-soft flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border-soft">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded-md">S</span>
            Splitwise Clone
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-bg-card text-primary font-medium' 
                    : 'text-graphite hover:bg-bg-base hover:text-charcoal'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-soft">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-charcoal truncate">{user?.name}</p>
              <p className="text-xs text-graphite truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-graphite hover:text-accent transition-colors rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
