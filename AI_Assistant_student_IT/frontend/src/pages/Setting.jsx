import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Clock, Save, User, Coffee, Info } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 1. Khởi tạo State với logic Cụm tiết nghỉ giải lao
  const [settings, setSettings] = useState({
    period1Start: '07:00',
    period7Start: '12:35',
    periodDuration: 50,
    hasBreak: true,
    breakDuration: 5,
    periodsPerBreak: 3 // Mặc định học 3 tiết mới nghỉ 1 lần
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchData = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/auth/student/${parsedUser._id}`),
          axios.get(`${API_URL}/api/auth/settings/${parsedUser._id}`)
        ]);
        
        if (profileRes.data.success) setProfile(profileRes.data.student);
        
        if (settingsRes.data.success && settingsRes.data.settings) {
          setSettings(settingsRes.data.settings);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu cài đặt", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // 2. Hàm lưu dữ liệu: Đồng bộ Database và LocalStorage
  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/settings/${user._id}`, settings);
      
      if (res.data.success) {
        setMessage('✅ Cấu hình hệ thống đã được đồng bộ!');
        
        // Cập nhật LocalStorage để trang Home/Timetable nhận cấu hình mới
        const updatedUser = { ...user, settings: res.data.settings };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      alert("Lỗi khi kết nối server!");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-blue-600 animate-pulse">Đang tải cấu hình...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <SettingsIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Cài đặt hệ thống</h1>
          <p className="text-gray-500 font-medium">Tùy chỉnh logic thời gian học thông minh</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* PHẦN 1: THÔNG TIN HỒ SƠ TÓM TẮT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
            <User className="text-blue-500 w-5 h-5" /> Thông tin mặc định
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 font-medium">Tài khoản:</span> <span className="font-bold">{user?.username}</span></p>
            <p className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 font-medium">Họ tên:</span> <span className="font-bold">{profile?.fullName || 'Chưa có'}</span></p>
          </div>
          <button onClick={() => navigate('/profile')} type="button" className="mt-4 text-xs bg-gray-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
            Chỉnh sửa hồ sơ chi tiết ➔
          </button>
        </div>

        {/* PHẦN 2: CẤU HÌNH THỜI GIAN VÀ LOGIC NGHỈ CỤM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2 border-b border-gray-50 pb-3">
            <Clock className="text-orange-500 w-5 h-5" /> Cấu hình khung giờ học
          </h2>

          {message && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 animate-fade-in">{message}</div>}

          {/* Hàng 1: Giờ bắt đầu các ca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-gray-700">Giờ bắt đầu Tiết 1 (Sáng)</label>
              <input type="time" value={settings.period1Start} onChange={e => setSettings({...settings, period1Start: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-gray-700">Giờ bắt đầu Tiết 7 (Chiều)</label>
              <input type="time" value={settings.period7Start} onChange={e => setSettings({...settings, period7Start: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Hàng 2: Thời lượng tiết học */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-gray-700">Thời lượng mỗi tiết</label>
              <div className="flex items-center gap-3">
                <input type="number" value={settings.periodDuration} onChange={e => setSettings({...settings, periodDuration: Number(e.target.value)})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-blue-600 outline-none focus:border-blue-500" />
                <span className="text-gray-400 font-bold whitespace-nowrap">phút / tiết</span>
              </div>
            </div>

            {/* LOGIC MỚI: SỐ TIẾT NGHỈ 1 LẦN */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                Học mấy tiết thì nghỉ? <Info size={14} className="text-gray-400" title="Ví dụ: Chọn 3 thì sau tiết 3 sẽ nghỉ giải lao" />
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" min="1" max="10" disabled={!settings.hasBreak}
                  value={settings.periodsPerBreak || 3} 
                  onChange={e => setSettings({...settings, periodsPerBreak: Number(e.target.value)})}
                  className={`w-full p-3.5 border rounded-xl outline-none font-bold text-purple-600 transition-all ${settings.hasBreak ? 'bg-purple-50 border-purple-200' : 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400'}`}
                />
                <span className="text-gray-400 font-bold whitespace-nowrap">tiết học / cụm</span>
              </div>
            </div>
          </div>

          {/* Hàng 3: Thời gian nghỉ giải lao */}
          <div className="space-y-2 md:w-1/2">
            <label className="text-sm font-extrabold text-gray-700">Số phút nghỉ giải lao mỗi cụm</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" min="0" max="60" disabled={!settings.hasBreak}
                value={settings.breakDuration} 
                onChange={e => setSettings({...settings, breakDuration: Number(e.target.value)})}
                className={`w-full p-3.5 border rounded-xl outline-none font-bold text-orange-600 transition-all ${settings.hasBreak ? 'bg-orange-50 border-orange-200' : 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400'}`}
              />
              <span className="text-gray-400 font-bold whitespace-nowrap">phút / lần nghỉ</span>
            </div>
          </div>

          {/* TOGGLE CHẾ ĐỘ NGHỈ (BỘ PHẬN LIÊN KẾT CHÍNH) */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between transition-all hover:border-blue-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors ${settings.hasBreak ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                <Coffee size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-700">Chế độ nghỉ giải lao theo cụm</p>
                <p className="text-xs text-gray-500 font-medium max-w-xs">
                  {settings.hasBreak 
                    ? `Hiện tại: Học liên tục ${settings.periodsPerBreak} tiết ➔ Nghỉ ${settings.breakDuration} phút`
                    : 'Các tiết học sẽ hiển thị liên tục không có khoảng nghỉ'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.hasBreak} 
                onChange={e => setSettings({...settings, hasBreak: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* NÚT LƯU */}
        <button 
          type="submit" 
          className="flex items-center justify-center gap-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
        >
          <Save size={20} /> Lưu cấu hình hệ thống
        </button>
      </form>
    </div>
  );
};

export default Settings;