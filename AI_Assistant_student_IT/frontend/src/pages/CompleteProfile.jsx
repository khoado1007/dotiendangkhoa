import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BookOpen, GraduationCap, Building, Clock, Coffee, Search, X } from 'lucide-react';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', dob: '', school: '', major: '', enrollmentYear: new Date().getFullYear()
  });

  // State cho Popup Cài đặt thời gian
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [timeSettings, setTimeSettings] = useState({
    period1Start: '07:00',
    period7Start: '12:35',
    periodDuration: 50,
    hasBreak: true,
    breakDuration: 5
  });

  // State cho tìm kiếm trường đại học
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const schoolInputRef = useRef(null);

  // State cho tìm kiếm ngành học
  const [majorSearch, setMajorSearch] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [majorSuggestions] = useState([
    'Công nghệ thông tin',
    'Kỹ thuật phần mềm',
    'Khoa học dữ liệu',
    'An toàn thông tin',
    'Kỹ thuật máy tính',
    'Trí tuệ nhân tạo',
    'Hệ thống thông tin',
    'Mạng máy tính',
    'Kinh tế',
    'Tài chính - Ngân hàng',
    'Kế toán',
    'Quản trị kinh doanh',
    'Marketing',
    'Luật',
    'Ngôn ngữ Anh',
    'Ngôn ngữ Trung',
    'Sư phạm Toán',
    'Sư phạm Lý',
    'Y khoa',
    'Dược học',
    'Điều dưỡng',
    'Kỹ thuật y sinh',
    'Kiến trúc',
    'Thiết kế đồ họa',
    'Kỹ thuật xây dựng',
    'Công nghệ ô tô',
    'Kỹ thuật điện - điện tử',
    'Công nghệ thực phẩm',
    'Sinh học',
    'Hóa học',
    'Vật lý',
    'Toán học',
    'Thống kê',
    'Báo chí',
    'Truyền thông đa phương tiện',
    'Quan hệ quốc tế',
    'Du lịch',
    'Khách sạn',
    'Giáo dục thể chất'
  ]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) navigate('/login');
    else setUser(JSON.parse(stored));
  }, [navigate]);

  // Debounce tìm kiếm trường đại học
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (schoolSearch.length >= 2) {
        setIsSearching(true);
        try {
          const res = await axios.get(`${API_URL}/api/auth/search-universities?query=${encodeURIComponent(schoolSearch)}`);
          if (res.data.success) {
            setSchoolResults(res.data.universities);
            setShowSchoolDropdown(true);
          }
        } catch (error) {
          console.error("Lỗi tìm kiếm trường:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSchoolResults([]);
        setShowSchoolDropdown(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [schoolSearch, API_URL]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (schoolInputRef.current && !schoolInputRef.current.contains(event.target)) {
        setShowSchoolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenPopup = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.dob || !formData.school || !formData.major) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    setShowTimePopup(true);
  };

  const handleFinalSubmit = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/auth/update-profile/${user._id}`, {
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

  const handleSchoolSelect = (schoolName) => {
    setFormData({ ...formData, school: schoolName });
    setSchoolSearch(schoolName);
    setShowSchoolDropdown(false);
    setSchoolResults([]);
  };

  const handleMajorSelect = (majorName) => {
    setFormData({ ...formData, major: majorName });
    setMajorSearch(majorName);
    setShowMajorDropdown(false);
  };

  const filteredMajors = majorSearch 
    ? majorSuggestions.filter(m => m.toLowerCase().includes(majorSearch.toLowerCase()))
    : majorSuggestions.slice(0, 10);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* POPUP CẤU HÌNH GIỜ HỌC */}
      {showTimePopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <Clock /> Thiết lập giờ học
            </h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ca Sáng bắt đầu</label>
                  <input 
                    type="time" 
                    value={timeSettings.period1Start} 
                    onChange={e => setTimeSettings({...timeSettings, period1Start: e.target.value})} 
                    className="w-full p-2.5 border rounded-lg bg-gray-50 outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ca Chiều bắt đầu</label>
                  <input 
                    type="time" 
                    value={timeSettings.period7Start} 
                    onChange={e => setTimeSettings({...timeSettings, period7Start: e.target.value})} 
                    className="w-full p-2.5 border rounded-lg bg-gray-50 outline-none focus:border-blue-500" 
                  />
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

            <button onClick={handleFinalSubmit} className="w-full mt-8 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg">
              Hoàn tất & Vào trang chủ
            </button>
          </div>
        </div>
      )}

      {/* FORM HỒ SƠ CHÍNH */}
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-black text-blue-600 mb-8 text-center uppercase tracking-wider">
          Hoàn tất hồ sơ
        </h2>
        
        <form onSubmit={handleOpenPopup} className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Họ và tên</label>
            <input 
              type="text" 
              required 
              placeholder="Nhập họ và tên" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none focus:border-blue-500" 
            />
          </div>

          {/* Ngày sinh */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Ngày sinh</label>
            <input 
              type="date" 
              required 
              value={formData.dob} 
              onChange={e => setFormData({...formData, dob: e.target.value})} 
              className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none text-gray-500" 
            />
          </div>

          {/* Trường đại học - Có tìm kiếm */}
          <div className="relative" ref={schoolInputRef}>
            <label className="block text-sm font-bold text-gray-600 mb-1">Trường đại học</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                required 
                placeholder="Nhập tên trường (VD: Đại học Bách Khoa)..." 
                value={schoolSearch} 
                onChange={e => {
                  setSchoolSearch(e.target.value);
                  setFormData({...formData, school: e.target.value});
                }}
                onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                className="w-full pl-10 p-3.5 border rounded-xl bg-gray-50 outline-none focus:border-blue-500" 
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Dropdown kết quả tìm kiếm trường */}
            {showSchoolDropdown && schoolResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {schoolResults.map((uni, index) => (
                  <div
                    key={index}
                    onClick={() => handleSchoolSelect(uni.name)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-bold text-gray-800">{uni.name}</div>
                    <div className="text-xs text-gray-500">{uni.code} - {uni.country}</div>
                  </div>
                ))}
              </div>
            )}
            
            {showSchoolDropdown && schoolSearch.length >= 2 && schoolResults.length === 0 && !isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg p-3 text-gray-500 text-sm">
                Không tìm thấy trường nào. Vui lòng thử từ khóa khác.
              </div>
            )}
          </div>

          {/* Ngành học - Có gợi ý */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-600 mb-1">Ngành học</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                required 
                placeholder="Nhập tên ngành học..." 
                value={majorSearch} 
                onChange={e => {
                  setMajorSearch(e.target.value);
                  setFormData({...formData, major: e.target.value});
                }}
                onFocus={() => setShowMajorDropdown(true)}
                className="w-full pl-10 p-3.5 border rounded-xl bg-gray-50 outline-none focus:border-blue-500" 
              />
            </div>
            
            {/* Dropdown gợi ý ngành */}
            {showMajorDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredMajors.map((major, index) => (
                  <div
                    key={index}
                    onClick={() => handleMajorSelect(major)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{major}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Năm nhập học */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Năm nhập học</label>
            <input 
              type="number" 
              required 
              min="2000" 
              max="2030"
              value={formData.enrollmentYear} 
              onChange={e => setFormData({...formData, enrollmentYear: Number(e.target.value)})} 
              className="w-full p-3.5 border rounded-xl bg-gray-50 outline-none focus:border-blue-500" 
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-md mt-4">
            Tiếp tục ➔
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

