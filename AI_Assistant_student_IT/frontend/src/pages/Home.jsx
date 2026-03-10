import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Info, Edit, StickyNote, X, PartyPopper, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getSchoolYear, calculateTotalWeeks, getWeekDateRange, 
  isSubjectActiveInWeek, isNoteInViewedWeek, isSubjectActive, formatDateForInput,
  getCurrentSemester, getCurrentWeek
} from '../utils/timehelper';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const getFallbackConfig = () => {
  const year = new Date().getFullYear();
  return {
    '1': { start: `${year}-09-05`, end: `${year + 1}-01-15` },
    '2': { start: `${year + 1}-02-15`, end: `${year + 1}-06-30` },
    'he': { start: `${year + 1}-07-05`, end: `${year + 1}-08-30` }
  };
};

const getCurrentSemesterKey = (config) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  for (const [key, value] of Object.entries(config)) {
    if(value.start && value.end){
      const st = new Date(value.start);
      const en = new Date(value.end);
      if (today >= st && today <= en) return key;
    }
  }
  return '1'; 
};

const getColForDay = (day) => {
  const mapping = { 'Thứ 2': 2, 'Thứ 3': 3, 'Thứ 4': 4, 'Thứ 5': 5, 'Thứ 6': 6, 'Thứ 7': 7, 'Chủ nhật': 8 };
  return mapping[day] || 2;
};

const getRowForPeriod = (session, startPeriod) => {
  if (session === 'Sáng') return startPeriod + 1; 
  if (session === 'Chiều') return startPeriod + 2; 
  if (session === 'Tối') return 16; 
  return 1;
};

const getRowSpan = (session, numberOfPeriods) => {
  if (session === 'Tối') return 1; 
  return numberOfPeriods || 1;
};

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [semesterConfig, setSemesterConfig] = useState(getFallbackConfig());
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');
  
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [totalWeeks, setTotalWeeks] = useState(1);

  const [settings, setSettings] = useState({ 
    period1Start: '07:00', period7Start: '12:35', 
    periodDuration: 50, hasBreak: true, breakDuration: 5, periodsPerBreak: 3 
  });

  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [noteModal, setNoteModal] = useState({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null });

  const [tomorrowDay, setTomorrowDay] = useState('');
  const [tomorrowClasses, setTomorrowClasses] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const daysMap = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    setTomorrowDay(daysMap[tmrw.getDay()]);

    fetchData(parsedUser._id);
  }, [navigate]);

  // Check for timetable updates from TimetableEntry page
  useEffect(() => {
    const checkForUpdates = () => {
      const updatedTimestamp = localStorage.getItem('timetableUpdated');
      const lastFetched = localStorage.getItem('timetableLastFetched');
      
      if (updatedTimestamp && user?._id) {
        // If there's a newer update than last fetch, refetch
        if (!lastFetched || parseInt(updatedTimestamp) > parseInt(lastFetched)) {
          fetchData(user._id);
          localStorage.setItem('timetableLastFetched', updatedTimestamp);
          // Clear the update flag
          localStorage.removeItem('timetableUpdated');
        }
      }
    };

    checkForUpdates();
    
    // Also check periodically when component is active (every 5 seconds)
    const interval = setInterval(checkForUpdates, 5000);
    return () => clearInterval(interval);
  }, [user]);

const fetchData = async (userId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL ;
      const [profileRes, timetableRes, semesterRes, settingsRes] = await Promise.all([
        axios.get(`${apiUrl}/api/auth/student/${userId}`),
        axios.get(`${apiUrl}/api/timetable/${userId}`),
        axios.get(`${apiUrl}/api/semester/${userId}`),
        axios.get(`${apiUrl}/api/auth/settings/${userId}`)
      ]);
      
      if (profileRes.data.success) setProfile(profileRes.data.student);
      if (timetableRes.data.success) setTimetables(timetableRes.data.data);
      
      let config = getFallbackConfig();
      
      // Use new semester collection first
      if (semesterRes.data.success && semesterRes.data.data) {
        const sem = semesterRes.data.data;
        config = {
          '1': { start: sem.semester1_start || config['1'].start, end: sem.semester1_end || config['1'].end },
          '2': { start: sem.semester2_start || config['2'].start, end: sem.semester2_end || config['2'].end },
          'he': { start: sem.semester_he_start || config['he'].start, end: sem.semester_he_end || config['he'].end }
        };
      }
      
      // Fallback to settings semesterConfig if exists
      if (settingsRes.data.success && settingsRes.data.settings) {
        setSettings(settingsRes.data.settings);
        if (settingsRes.data.settings.semesterConfig) {
          config = settingsRes.data.settings.semesterConfig;
        }
      }
      setSemesterConfig(config);

      // Use unified getCurrentSemester from timehelper to detect current semester
      const currentSem = getCurrentSemester(config);
      setSelectedSemester(currentSem);
      setSemesterStart(config[currentSem].start);
      setSemesterEnd(config[currentSem].end);

      // Calculate and set the current week based on today's date
      const currentWeek = getCurrentWeek(config[currentSem].start);
      setSelectedWeek(currentWeek);

    } catch (err) {
      console.error("Lỗi:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (!semesterStart || !semesterEnd) return;
    
    const start = new Date(semesterStart);
    const end = new Date(semesterEnd);
    const total = calculateTotalWeeks(start, end);
    setTotalWeeks(total);

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const realCurrentSemester = getCurrentSemesterKey(semesterConfig);

    if (selectedSemester === realCurrentSemester) {
      let currentWk = Math.ceil((today - start) / (1000 * 60 * 60 * 24 * 7));
      if (currentWk < 1) currentWk = 1;
      if (currentWk > total) currentWk = total;
      setSelectedWeek(currentWk);
    } else {
      setSelectedWeek(1); 
    }
  }, [semesterStart, semesterEnd, selectedSemester, semesterConfig]);

  const handleSemesterChange = (e) => {
    const val = e.target.value;
    setSelectedSemester(val);
    setSemesterStart(semesterConfig[val]?.start || '');
    setSemesterEnd(semesterConfig[val]?.end || '');
  };

  const currentWeekRange = getWeekDateRange(semesterStart, selectedWeek);

  const activeTimetables = timetables.filter(item => {
    if (item.semester !== selectedSemester) return false;
    if (!item.isNote) {
      return isSubjectActiveInWeek(item.startDate, item.endDate, currentWeekRange.weekStart, currentWeekRange.weekEnd);
    }
    if (item.isNote && item.session === 'Tối' && item.isTemporary) {
      return isNoteInViewedWeek(item.createdAt, currentWeekRange.weekStart, currentWeekRange.weekEnd);
    }
    return true; 
  });

  useEffect(() => {
    const realCurrentSemester = getCurrentSemesterKey(semesterConfig);
    const tomorrowList = timetables.filter(t => 
      t.semester === realCurrentSemester && 
      t.dayOfWeek === tomorrowDay && 
      !t.isNote && 
      isSubjectActive(t.startDate, t.endDate)
    );
    const sorted = tomorrowList.sort((a, b) => {
      const sessionWeight = { 'Sáng': 1, 'Chiều': 2, 'Tối': 3 };
      if (sessionWeight[a.session] !== sessionWeight[b.session]) return sessionWeight[a.session] - sessionWeight[b.session];
      return a.startPeriod - b.startPeriod;
    });
    setTomorrowClasses(sorted.slice(0, 5));
  }, [timetables, tomorrowDay, semesterConfig]);

  const getPeriodTimes = () => {
    const times = [];
    const dur = settings.periodDuration || 50;
    const breakDur = settings.hasBreak ? (settings.breakDuration || 5) : 0;
    const pPerBreak = settings.periodsPerBreak || 3;

    const calc = (startTimeStr, index) => {
       const [h, m] = startTimeStr.split(':').map(Number);
       const baseMins = h * 60 + m;
       const numBreaks = Math.floor(index / pPerBreak);
       const startTotalMins = baseMins + (index * dur) + (numBreaks * breakDur);
       const format = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
       return `${format(startTotalMins)}-${format(startTotalMins + dur)}`;
    };

    for (let i = 1; i <= 6; i++) times.push({ p: i, time: calc(settings.period1Start, i - 1) });
    for (let i = 7; i <= 12; i++) times.push({ p: i, time: calc(settings.period7Start, i - 7) });
    return times;
  };
  const periodTimesList = getPeriodTimes();

  const handleSaveNote = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL ;
      const payload = {
        isNote: true, noteContent: noteModal.content, session: noteModal.session, 
        dayOfWeek: noteModal.day, startPeriod: noteModal.startPeriod, numberOfPeriods: 1, 
        isTemporary: noteModal.session === 'Tối',
        semester: selectedSemester, userId: user._id 
      };
      await axios.post(`${apiUrl}/api/timetable/add`, payload);
      fetchData(user._id);
      setNoteModal({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null });
    } catch (err) { alert("Lỗi khi lưu ghi chú!"); }
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-blue-600">Đang chuẩn bị lộ trình học...</div>;

  return (
    <div className="p-6 md:p-8 animate-fade-in relative max-w-[1600px] mx-auto min-h-full flex flex-col space-y-6">
      
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setDetailModal({ isOpen: false, data: null })} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Info size={24} /></div>
              <h3 className="text-xl font-bold text-gray-800 leading-tight">{detailModal.data.subjectName}</h3>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="flex items-center gap-3 text-gray-700 font-medium"><Calendar className="w-5 h-5 text-gray-400"/> {detailModal.data.dayOfWeek} - Buổi {detailModal.data.session}</p>
              {detailModal.data.session !== 'Tối' && (
                <p className="flex items-center gap-3 text-blue-700 font-bold bg-blue-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500"/> Tiết {detailModal.data.startPeriod} đến {detailModal.data.startPeriod + detailModal.data.numberOfPeriods - 1}
                </p>
              )}
              <p className="flex items-center gap-3 text-gray-700 font-medium"><MapPin className="w-5 h-5 text-gray-400"/> Phòng: {detailModal.data.room || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      )}

      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative">
            <button onClick={() => setNoteModal({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null })} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X /></button>
            <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center gap-2">
               <StickyNote className="text-yellow-500"/> Ghi chú ({noteModal.day})
            </h3>
            {noteModal.session === 'Tối' && <p className="text-[10px] text-red-500 font-black mb-4 uppercase tracking-widest">Tự động xóa khi sang tuần mới</p>}
            <textarea rows="4" placeholder="Nhập nội dung ghi chú..." value={noteModal.content} onChange={e => setNoteModal({...noteModal, content: e.target.value})} className="w-full p-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-yellow-200 bg-gray-50/50 resize-none text-sm font-medium"/>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setNoteModal({isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null})} className="flex-1 py-3 font-bold text-gray-400 hover:text-gray-600">Hủy</button>
              <button onClick={handleSaveNote} className="flex-[2] bg-yellow-500 text-white font-black py-3 rounded-2xl hover:bg-yellow-600 shadow-lg shadow-yellow-100 uppercase text-xs">Lưu ghi chú</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">Năm học {getSchoolYear()}</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">Xin chào, {profile?.fullName || user?.username}! 👋</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-400 uppercase">Học kỳ:</span>
             <select value={selectedSemester} onChange={handleSemesterChange} className="p-2.5 bg-gray-50 border-none rounded-xl font-black text-blue-600 outline-none cursor-pointer">
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="he">Học kỳ Hè</option>
             </select>
          </div>
          
          <div className="flex items-center bg-blue-50 p-1.5 rounded-2xl border border-blue-100 w-full sm:w-auto justify-between min-w-[240px]">
             <div className="w-10 flex justify-center">
               {selectedWeek > 1 && (
                  <button onClick={() => setSelectedWeek(prev => prev - 1)} className="p-2 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm"><ChevronLeft size={20}/></button>
               )}
             </div>
             
             <div className="px-2 text-center flex flex-col items-center">
                <span className="font-black text-blue-700 text-sm uppercase tracking-wide">Tuần {selectedWeek} / {totalWeeks}</span>
                {semesterStart && (
                  <span className="text-[10px] font-bold text-blue-400 mt-1">
                    {currentWeekRange.weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'})} ➔ {currentWeekRange.weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'})}
                  </span>
                )}
             </div>

             <div className="w-10 flex justify-center">
               {selectedWeek < totalWeeks && (
                  <button onClick={() => setSelectedWeek(prev => prev + 1)} className="p-2 text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm"><ChevronRight size={20}/></button>
               )}
             </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1">
        
        <div className="xl:col-span-3 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-5 flex flex-col overflow-hidden">
          <div className="overflow-x-auto w-full flex-1 custom-scrollbar">
            <div className="min-w-[800px] h-full bg-gray-200 border border-gray-200 rounded-3xl overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))', gridTemplateRows: '35px repeat(6, 40px) 18px repeat(6, 40px) 18px 60px', gap: '1px' }}>
              <div className="bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-[10px] uppercase">Tiết</div>
              {DAYS.map((day) => (<div key={day} className={`bg-gray-50 flex items-center justify-center font-bold text-xs ${tomorrowDay === day ? 'text-blue-600' : 'text-gray-600'}`}>{day} {tomorrowDay === day && <span className="ml-1 text-[8px] bg-blue-500 text-white px-1 py-0.5 rounded-full">Mai</span>}</div>))}

              {[1,2,3,4,5,6].map(p => <div key={`p${p}`} className="bg-white flex items-center justify-center text-[10px] font-bold text-gray-300" style={{ gridColumn: 1, gridRow: p + 1 }}>{p}</div>)}
              <div className="bg-gray-100/50 flex items-center justify-center text-[10px] font-black text-gray-300 tracking-[0.5em]" style={{ gridColumn: '2 / span 7', gridRow: 8 }}>LUNCH BREAK</div>
              {[7,8,9,10,11,12].map(p => <div key={`p${p}`} className="bg-white flex items-center justify-center text-[10px] font-bold text-gray-300" style={{ gridColumn: 1, gridRow: p + 2 }}>{p}</div>)}
              <div className="bg-gray-100/50 flex items-center justify-center text-[10px] font-black text-gray-300 tracking-[0.5em]" style={{ gridColumn: '2 / span 7', gridRow: 15 }}>SHORT BREAK</div>
              <div className="bg-white flex items-center justify-center text-[10px] font-bold text-gray-300" style={{ gridColumn: 1, gridRow: 16 }}>Tối</div>

              {DAYS.map((day, dIdx) => {
                const col = dIdx + 2;
                return (
                  <React.Fragment key={`cell-${day}`}>
                    {[1,2,3,4,5,6].map(p => <div key={`s-${p}`} className="bg-white hover:bg-blue-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: p + 1 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Sáng', startPeriod: p, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-blue-200 w-5 h-5"/></div>)}
                    {[7,8,9,10,11,12].map(p => <div key={`c-${p}`} className="bg-white hover:bg-blue-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: p + 2 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Chiều', startPeriod: p, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-blue-200 w-5 h-5"/></div>)}
                    <div className="bg-white hover:bg-yellow-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: 16 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Tối', startPeriod: null, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-yellow-200 w-6 h-6"/></div>
                  </React.Fragment>
                )
              })}

              {activeTimetables.map((item) => {
                const col = getColForDay(item.dayOfWeek);
                const rowStart = getRowForPeriod(item.session, item.startPeriod);
                const rowSpan = getRowSpan(item.session, item.numberOfPeriods);

                return (
                  <div
                    key={`item-${item._id}`}
                    style={{ gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}` }}
                    onClick={() => item.isNote ? setNoteModal({ isOpen: true, day: item.dayOfWeek, session: item.session, startPeriod: item.startPeriod, content: item.noteContent, noteId: item._id }) : setDetailModal({ isOpen: true, data: item })}
                    className={`z-10 m-[1px] rounded-xl p-2 shadow-sm border flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
                      item.isNote ? 'bg-yellow-100/90 border-yellow-200' : 'bg-blue-100/90 border-blue-200'
                    }`}
                  >
                    {item.isNote ? (
                      <span className="text-[10px] font-bold text-yellow-800 line-clamp-2 text-center uppercase leading-tight">📝 {item.noteContent}</span>
                    ) : (
                      <>
                        <span className="font-black text-blue-900 text-[10px] text-center leading-tight line-clamp-2 uppercase">{item.subjectName}</span>
                        {item.room && <span className="text-[8px] font-black text-blue-500 bg-white/50 px-1 rounded mt-1 mx-auto">{item.room}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-black mb-4 text-blue-600 flex items-center gap-2 uppercase tracking-widest border-b pb-2"><Clock size={16}/> Giờ học </h2>
            <div className="grid grid-cols-3 gap-2">
              {periodTimesList.map(pt => (
                <div key={pt.p} className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-gray-400">Tiết {pt.p}</span>
                  <span className="text-[9px] font-black text-gray-800 tracking-tighter">{pt.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <h2 className="text-sm font-black mb-4 text-orange-500 flex items-center gap-2 uppercase tracking-widest border-b pb-2"><Calendar size={16}/> Lịch ngày mai</h2>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {tomorrowClasses.length > 0 ? tomorrowClasses.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border shadow-sm ${item.session === 'Sáng' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                  <span className="font-bold block text-[10px] mb-1 opacity-60 uppercase">{item.session} - Tiết {item.startPeriod}</span>
                  <span className="font-black text-xs leading-tight text-gray-800 uppercase">{item.subjectName}</span>
                  <p className="text-[10px] mt-2 font-bold flex items-center gap-1.5 text-gray-400"><MapPin size={12}/> {item.room || 'TBA'}</p>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <PartyPopper className="w-10 h-10 text-yellow-400 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-gray-400">Ngày mai trống lịch!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;