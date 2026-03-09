import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User as UserIcon, Mail, Chrome } from 'lucide-react';

const Auth = () => {
  // Sử dụng biến môi trường hoặc mặc định là localhost
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true); // Toggle Đăng nhập / Đăng ký
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // Handle Google OAuth callback
  useEffect(() => {
    const googleAuth = searchParams.get('googleAuth');
    const userId = searchParams.get('userId');
    
    if (googleAuth === 'success' && userId) {
      // Fetch user data and save to localStorage
      axios.get(`${API_URL}/api/auth/validate/${userId}`)
        .then(res => {
          if (res.data.success) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/home');
          }
        })
        .catch(() => {
          setErrors({ general: 'Đăng nhập Google thất bại!' });
        });
    } else if (googleAuth === 'error') {
      setErrors({ general: 'Đăng nhập Google thất bại!' });
    }
  }, [searchParams, navigate, API_URL]);

  // Initialize Google OAuth - load the script
  useEffect(() => {
    // Check if Google script is already loaded
    if (!document.getElementById('google-identity-script')) {
      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handle Google OAuth response
  const handleGoogleResponse = async (response) => {
    if (response.access_token) {
      try {
        // Get user info from Google using the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        
        // Send user info to backend to create/find user
        const res = await axios.post(`${API_URL}/api/auth/google`, {
          email: userInfo.email,
          googleId: userInfo.sub,
          displayName: userInfo.name
        });
        
        if (res.data.success) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/home');
        }
      } catch (err) {
        console.error('Google auth error:', err);
        setErrors({ general: 'Đăng nhập Google thất bại!' });
      }
    }
  };

  // Real Google OAuth login
  const handleGoogleAuth = () => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        scope: 'profile email openid',
        callback: handleGoogleResponse,
      });
      client.requestAccessToken();
    } else {
      // Fallback: show setup instructions
      setErrors({ general: 'Vui lòng cấu hình Google OAuth Client ID trong .env' });
    }
  };

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

        <button 
          type="button" onClick={handleGoogleAuth}
          className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all mb-6 shadow-sm active:scale-95"
        >
          <Chrome className="w-5 h-5 text-red-500" />
          Tiếp tục với Gmail
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <span className="absolute bg-white px-3 text-xs text-gray-400 font-semibold uppercase">Hoặc</span>
          <div className="w-full h-px bg-gray-200"></div>
        </div>

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

