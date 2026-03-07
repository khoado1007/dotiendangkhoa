import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BookOpen, GraduationCap, Building, Clock, Coffee } from 'lucide-react';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', dob: '', school: 'Đại học Công nghệ Sài Gòn (STU)', major: 'Công nghệ thông tin', enrollmentYear: 2026
  });

  // State cho Popup Cài đặt thời gian
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [timeSettings, setTimeSettings] = useState({
    period1Start: '07:00',
    period7Start: '12:35',
    periodDuration: 50,
    hasBreak: true, // Mặc định Checked
    breakDuration: 5 // Mặc định 5 phút
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) navigate('/login');
    else setUser(JSON.parse(stored));
  }, [navigate]);

  const handleOpenPopup = (e) => {
    e.preventDefault();
    setShowTimePopup(true);
  };

  const handleFinalSubmit = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/update-profile/${user._id}`, {
        ...formData,
        settings: timeSettings
      });
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/home');
      }
    } catch (err) {
      alert("Lỗi khi lưu thông tin!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* POPUP CẤU HÌNH GIỜ HỌC */}
      {showTimePopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2"><Clock /> Thiết lập giờ học</h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ca Sáng bắt đầu</label>
                  <input type="time" value={timeSettings.period1Start} onChange={e => setTimeSettings({...timeSettings, period1Start: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ca Chiều bắt đầu</label>
                  <input type="time" value={timeSettings.period7Start} onChange={e => setTimeSettings({...timeSettings, period7Start: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={timeSettings.hasBreak} 
                    onChange={e => setTimeSettings({...timeSettings, hasBreak: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-bold text-sm text-gray-700">Nghỉ giữa mỗi tiết học</span>
                </label>
                
                {timeSettings.hasBreak && (
                  <div className="mt-4 flex items-center gap-3 pl-8">
                    <input 
                      type="number" min="0" max="30" 
                      value={timeSettings.breakDuration} 
                      onChange={e => setTimeSettings({...timeSettings, breakDuration: Number(e.target.value)})}
                      className="w-20 p-2 border rounded-lg text-center font-bold text-blue-600 outline-none"
                    />
                    <span className="text-xs font-medium text-gray-500">Số phút nghỉ mặc định</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleFinalSubmit} className="w-full mt-8 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg">Hoàn tất & Vào trang chủ</button>
          </div>
        </div>
      )}

      {/* FORM HỒ SƠ CHÍNH (Giữ nguyên giao diện của bạn) */}
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-black text-blue-600 mb-8 text-center uppercase tracking-wider">Hoàn tất hồ sơ</h2>
        <form onSubmit={handleOpenPopup} className="space-y-4">
          <input type="text" required placeholder="Họ và tên" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none focus:border-blue-500" />
          <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none text-gray-500" />
          <input type="text" required placeholder="Trường học (VD: STU)" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none" />
          <input type="text" required placeholder="Ngành học" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none" />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-md mt-4">Tiếp tục ➔</button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;