/**
 * =====================================================
 * ADMIN DASHBOARD PAGE
 * =====================================================
 * 
 * API ENDPOINTS USED:
 * -------------------
 * 1. GET /api/admin/dashboard-stats  - Lấy dữ liệu thống kê
 * 
 * TEST CREDENTIALS:
 * -----------------
 * - Login with: admin/admin
 * - Redirect: /admin route
 * 
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, School, BookOpen, Shield, LogOut, BarChart3 } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // API URL - Lấy từ biến môi trường hoặc mặc định
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Kiểm tra user đã đăng nhập chưa
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    
    // Kiểm tra role có phải admin không
    if (parsedUser.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang Admin!');
      navigate('/home');
      return;
    }

    setUser(parsedUser);
    fetchDashboardStats();
  }, [navigate]);

  // =====================================================
  // LẤY DỮ LIỆU THỐNG KÊ DASHBOARD
  // API: GET /api/admin/dashboard-stats
  // =====================================================
  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/dashboard-stats`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-purple-100 font-medium">
                  Xin chào, {user?.username}! 👋
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-black text-gray-800">{stats?.totalUsers || 0}</span>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wide">Tổng số sinh viên</h3>
        </div>

        {/* Schools Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <School className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-black text-gray-800">{stats?.schoolStats?.length || 0}</span>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wide">Số trường ĐH</h3>
        </div>

        {/* Majors Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-3xl font-black text-gray-800">{stats?.majorStats?.length || 0}</span>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wide">Số ngành học</h3>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">
              Thống kê theo Trường
            </h2>
          </div>
          
          {stats?.schoolStats && stats.schoolStats.length > 0 ? (
            <div className="space-y-3">
              {stats.schoolStats.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700 truncate flex-1 mr-2">
                    {item._id || 'Chưa xác định'}
                  </span>
                  <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Major Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">
              Thống kê theo Ngành
            </h2>
          </div>
          
          {stats?.majorStats && stats.majorStats.length > 0 ? (
            <div className="space-y-3">
              {stats.majorStats.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700 truncate flex-1 mr-2">
                    {item._id || 'Chưa xác định'}
                  </span>
                  <span className="font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Back to Home */}
      <div className="max-w-7xl mx-auto mt-8">
        <button
          onClick={() => navigate('/home')}
          className="text-blue-600 font-bold hover:underline"
        >
          ← Quay lại trang chủ
        </button>
      </div>
    </div>
  );
};

export default Admin;

