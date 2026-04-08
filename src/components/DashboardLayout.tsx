import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, User, LogOut, Bell, Menu, X, Moon, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: User, label: 'Profile', path: '/profile' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.get('/notifications');
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return;
    
    try {
      await Promise.all(unreadIds.map(id => api.put(`/notifications/${id}`, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-5 border-b border-border/50">
        <span className="text-xl font-bold gradient-text">CollabCore</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <div className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'gradient-primary text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/50 space-y-1">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/80 glass fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border/50 flex flex-col animate-slide-in-left shadow-2xl">
            <div className="absolute right-3 top-4">
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border/50 bg-card/60 glass sticky top-0 z-30">
          <button className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-xl relative hover:bg-muted transition-all duration-200" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead(); }}>
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-glow">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/50 bg-card shadow-card-hover p-4 z-50 animate-fade-in">
                  <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No notifications yet</p>
                    ) : notifications.map(n => (
                      <div key={n._id} className={`p-3 rounded-xl text-sm transition-colors ${n.read ? 'hover:bg-muted/50' : 'bg-primary/5 border border-primary/10'}`}>
                        <p className="text-foreground">{n.message}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link to="/profile" className="flex items-center gap-3 pl-3 border-l border-border/50">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-soft transition-transform duration-200 hover:scale-105">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{profile?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{profile?.email}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
