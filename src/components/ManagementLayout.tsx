import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ManagementLayoutProps {
  children: React.ReactNode;
}

const ManagementLayout: React.FC<ManagementLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { key: '/', icon: '🏠', label: '首页' },
    { key: '/navigation', icon: '📚', label: '课件导航' },
    { key: '/config', icon: '⚙️', label: '配置中心' },
  ];

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (menuItems.some(item => item.key === path)) {
      return path;
    }
    return '/';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 glass-dark border-r border-white/10 transition-all duration-300 z-50 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="text-white text-2xl font-bold">
            {collapsed ? 'R' : 'Reedu'}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                getSelectedKey() === item.key
                  ? 'bg-white/30 text-white shadow-lg scale-105'
                  : 'text-white/90 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 font-semibold"
          >
            <span className="text-xl">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span className="font-medium">收起</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <header className="glass-card sticky top-0 z-40 h-16 px-6 flex items-center justify-end border-b border-gray-200/50">
          {/* User Section */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                <span>🔐</span> 登录
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/20 rounded-full transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-semibold text-gray-800">
                    {user?.email?.split('@')[0] || '用户'}
                  </span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 glass-card p-2 z-50 animate-slide-up">
                      <div className="px-4 py-3 border-b border-gray-200/50 mb-2">
                        <p className="font-semibold text-gray-800 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/config');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all duration-200"
                      >
                        <span>⚙️</span> 配置中心
                      </button>
                      <div className="my-2 border-t border-gray-200/50" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                      >
                        <span>🚪</span> 退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ManagementLayout;
