import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import CompleteProfile from './pages/Completeprofile';
import TimetableEntry from './pages/TimetableEntry';
import Settings from './pages/Setting';
import Roadmap from './pages/Roadmap';

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
      </Routes>
    </Router>
  );
}

export default App;

