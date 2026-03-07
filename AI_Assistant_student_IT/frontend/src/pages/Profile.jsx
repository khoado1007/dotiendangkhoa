import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BookOpen, GraduationCap, Building, Edit2, Check, X, Mail } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    school: '',
    major: '',
    enrollmentYear: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Tải dữ liệu khi vào trang
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/student/${parsedUser._id}`);
        if (res.data.success && res.data.student) {
          const s = res.data.student;
          setFormData({
            fullName: s.fullName || '',
            dob: s.dob ? s.dob.split('T')[0] : '', // Format ngày sinh chuẩn YYYY-MM-DD
            school: s.schoolName || 'Đại học Công nghệ Sài Gòn (STU)',
            major: s.majorName || '',
            enrollmentYear: s.enrollmentYear || ''
          });
        }
      } catch (err) {
        console.error("Chưa có hồ sơ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // 2. Xử lý lưu thông tin
 const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/update-profile/${user._id}`, {
        fullName: formData.fullName,
        dob: formData.dob,
        school: formData.school,
        major: formData.major,
        enrollmentYear: formData.enrollmentYear
      });

      if (res.data.success) {
        setSuccess('Cập nhật hồ sơ thành công!');
        setIsEditing(false); 
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ!');
    }
  };
  if (loading) return <div className="text-center p-10 font-bold text-blue-600">Đang tải hồ sơ...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Phần Header / Cover (Ảnh bìa) */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-full p-1 shadow-lg">
            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">{formData.fullName || user?.username}</h2>
              <p className="text-gray-500 font-medium flex items-center gap-1 mt-1">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
            </div>
            
            {/* Nút Toggle Edit Mode */}
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" /> Hủy
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-md shadow-green-200"
                >
                  <Check className="w-4 h-4" /> Lưu lại
                </button>
              </div>
            )}
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium">{success}</div>}

          {/* Form Thông tin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" disabled={!isEditing}
                  value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isEditing ? 'border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'} outline-none transition-all`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ngày sinh</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="date" disabled={!isEditing}
                  value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isEditing ? 'border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'} outline-none transition-all`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Trường đang học</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" disabled={!isEditing}
                  value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isEditing ? 'border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'} outline-none transition-all`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngành học</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" disabled={!isEditing}
                    value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isEditing ? 'border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'} outline-none transition-all`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Khóa (Năm nhập học)</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input 
                    type="number" disabled={!isEditing}
                    value={formData.enrollmentYear} onChange={e => setFormData({...formData, enrollmentYear: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isEditing ? 'border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'} outline-none transition-all`}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;