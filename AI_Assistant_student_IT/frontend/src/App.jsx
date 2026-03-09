/**
 * =====================================================
 * APP ROUTES - Route Configuration
 * =====================================================
 * 
 * ROUTES:
 * -------
 * /login           - Trang đăng nhập/đăng ký
 * /home            - Trang chủ (Timeline/Timetable)
 * /timetable-entry - Nhập lịch học
 * /profile         - Hồ sơ sinh viên
 * /complete-profile - Hoàn thiện hồ sơ
 * /settings        - Cài đặt
 * /roadmap         - Lộ trình học
 * /admin           - Dashboard Admin (Test)
 * 
 * API ROUTES:
 * -----------
 * /api/auth/*         - Auth endpoints
 * /api/admin/*        - Admin endpoints
 * /api/timetable/*    - Timetable endpoints
 * /api/roadmap/*      - Roadmap endpoints
 * 
 * =====================================================
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import CompleteProfile from './pages/CompleteProfile';
import TimetableEntry from './pages/TimetableEntry';
import Settings from './pages/Setting';
import Roadmap from './pages/Roadmap';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="timetable-entry" element={<TimetableEntry />} />
          <Route path="profile" element={<Profile />} />
          <Route path="complete-profile" element={<CompleteProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="roadmap" element={<Roadmap />} />
        </Route>
        
        {/* =====================================================
          ADMIN ROUTE - For Testing
          Requires: user.role === 'admin'
          API: GET /api/admin/dashboard-stats
        ====================================================== */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;

