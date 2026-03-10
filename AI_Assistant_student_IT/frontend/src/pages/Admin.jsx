import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Admin = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalTimetables: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL ;
        const response = await axios.get(`${apiUrl}/api/admin/dashboard-stats`);
        
        if (response.data.success) {
          setStats({
            ...response.data.stats,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard statistics'
        }));
      }
    };

    fetchStats();
  }, []);

  const chartData = {
    labels: ['Sinh viên', 'Môn học', 'Lịch học'],
    datasets: [
      {
        label: 'Thống kê hệ thống',
        data: [stats.totalStudents, stats.totalSubjects, stats.totalTimetables],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tổng quan hệ thống',
        font: { size: 16, weight: 'bold' },
        color: '#374151'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">Quản lý hệ thống AI Assistant Student IT</p>
      </div>

      {stats.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {stats.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng sinh viên</p>
              <p className="text-3xl font-black text-blue-600 mt-1">{stats.totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng môn học</p>
              <p className="text-3xl font-black text-purple-600 mt-1">{stats.totalSubjects}</p>
            </div>
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng lịch học</p>
              <p className="text-3xl font-black text-green-600 mt-1">{stats.totalTimetables}</p>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Biểu đồ thống kê</h2>
        </div>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Admin;

