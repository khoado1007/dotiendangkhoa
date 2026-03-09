/**
 * =====================================================
 * AUTH PAGE - Login/Register
 * =====================================================
 * 
 * API ENDPOINTS USED:
 * -------------------
 * 1. POST /api/auth/login        - Đăng nhập thủ công
 * 2. POST /api/auth/register    - Đăng ký tài khoản mới
 * 3. GET  /api/auth/validate/:id - Xác thực user
 * 
 * TEST CREDENTIALS:
 * -----------------
 * - Admin: username="admin", password="admin"
 * - Student: Tạo tài khoản mới hoặc đăng ký
 * 
 * =====================================================
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Mail } from 'lucide-react';

const Auth = () => {
  // Sử dụng biến môi trường hoặc mặc định là localhost
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggle Đăng nhập / Đăng ký
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({ email: '', username: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side Validation cơ bản
    if (!formData.username.trim()) return setErrors({ general: 'Vui lòng nhập Username' });
    if (!formData.password) return setErrors({ general: 'Vui lòng nhập Mật khẩu' });
    if (!isLogin && !formData.email) return setErrors({ general: 'Vui lòng nhập Email' });

    try {
      const url = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
      const res = await axios.post(url, formData);
      
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (!isLogin) {
          navigate('/complete-profile');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Lỗi kết nối máy chủ!' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-blue-600 mb-6">
          {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h2>

        {errors.general && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 text-center animate-pulse">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="email" placeholder="Email của bạn" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="relative group">
            <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" placeholder={isLogin ? "Tài khoản hoặc Email" : "Tên đăng nhập (Username)"}
              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="password" placeholder="Mật khẩu" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold transition-all hover:bg-blue-700 active:scale-95 shadow-md">
            {isLogin ? 'Vào hệ thống' : 'Đăng ký ngay'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button type="button" onClick={toggleMode} className="text-blue-600 font-bold hover:underline">
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;

