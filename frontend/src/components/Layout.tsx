import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  Cards,
  Microphone,
  BookOpenText,
  PenNib,
  SignOut,
  List,
  X,
  Headphones,
} from '@phosphor-icons/react';

const navItems = [
  { path: '/dashboard',  label: 'Tổng quan',    icon: House,        color: 'text-white' },
  { path: '/vocabulary', label: 'Từ vựng',      icon: Cards,        color: 'text-purple-400' },
  { path: '/speaking',   label: 'Luyện nói',    icon: Microphone,   color: 'text-indigo-400' },
  { path: '/listening',  label: 'Luyện nghe',   icon: Headphones,   color: 'text-sky-400' },
  { path: '/reading', label: 'Luyện đọc', icon: BookOpenText, color: 'text-emerald-400' },
  { path: '/writing', label: 'Luyện viết', icon: PenNib,      color: 'text-orange-400' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path.startsWith('/vocabulary')) return location.pathname.startsWith('/vocabulary');
    if (path.startsWith('/speaking')) return location.pathname.startsWith('/speaking');
    if (path.startsWith('/listening')) return location.pathname.startsWith('/listening');
    if (path.startsWith('/reading')) return location.pathname.startsWith('/reading');
    if (path.startsWith('/writing')) return location.pathname.startsWith('/writing');
    return false;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0a0a0a] border-r border-white/5
          flex flex-col z-40 transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex
        `}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/5 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">E</div>
            <span className="font-bold tracking-tight text-lg">ELearn</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ path, label, icon: Icon, color }) => {
            const active = isActive(path);
            // For reading/writing use their base paths for display
            const displayPath = path.startsWith('/reading') ? '/reading' : path.startsWith('/writing') ? '/writing' : path;
            return (
              <Link
                key={displayPath}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-200 group relative
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full" />
                )}
                <Icon
                  size={20}
                  weight={active ? 'duotone' : 'regular'}
                  className={active ? color : 'text-gray-500 group-hover:text-gray-300'}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <SignOut size={20} className="group-hover:text-red-400 transition-colors" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <List size={24} />
          </button>
          <div className="font-bold tracking-tight">ELearn</div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
