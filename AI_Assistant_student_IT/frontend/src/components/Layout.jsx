import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
// Đã thêm SettingsIcon, Map (cho Lộ trình) và useNavigate
import { Home, Calendar, Map, Dumbbell, BookOpen, User, Settings as SettingsIcon, LogOut } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Danh sách các menu điều hướng đã được cập nhật đầy đủ
  const menuItems = [
    { path: '/home', name: 'Trang chủ', icon: Home },
    { path: '/timetable-entry', name: 'Quản lý lịch học', icon: Calendar },
    { path: '/roadmap', name: 'Lộ trình AI', icon: Map },
    { path: '/practice', name: 'Luyện tập', icon: Dumbbell },
    { path: '/study', name: 'Tài liệu học', icon: BookOpen },
    { path: '/profile', name: 'Hồ sơ', icon: User },
    { path: '/settings', name: 'Cài đặt', icon: SettingsIcon },
  ];

  // Hàm xử lý đăng xuất an toàn (Xóa bộ nhớ cục bộ trước khi out)
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Sidebar bên trái */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        {/* Logo / Tên App */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            AI Assistant
          </h2>
          <p className="text-xs text-gray-500 font-medium tracking-wide mt-1 uppercase">Student IT</p>
        </div>
        
        {/* Các nút Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Nút Đăng xuất ở cuối Sidebar (Đã đổi thành button) */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium outline-none"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Khu vực Nội dung chính (Bên phải) */}
      <div className="flex-1 overflow-y-auto relative bg-gray-50/50">
        {/* Nơi này sẽ hiển thị trang Home, Timetable, Profile... tùy vào URL */}
        <Outlet /> 
      </div>
      
    </div>
  );
};

export default Layout;