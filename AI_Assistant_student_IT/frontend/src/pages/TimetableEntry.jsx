import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, X, Info, PlusCircle, StickyNote, Edit, Trash2, Save } from 'lucide-react';
import { getSchoolYear, formatDateForInput } from '../utils/timehelper';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SESSIONS = ['Sáng', 'Chiều', 'Tối'];

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

// Tạo ngày gợi ý ban đầu để Form không bao giờ bị rỗng (Ngăn lỗi Server)
const getFallbackSemesterConfig = () => {
  const year = new Date().getFullYear();
  return {
    '1': { start: `${year}-09-05`, end: `${year + 1}-01-15` },
    '2': { start: `${year + 1}-02-15`, end: `${year + 1}-06-30` },
    'he': { start: `${year + 1}-07-05`, end: `${year + 1}-08-30` }
  };
};

const TimetableEntry = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timetables, setTimetables] = useState([]);
  
  const [semesterConfig, setSemesterConfig] = useState(getFallbackSemesterConfig());
  const [selectedSemester, setSelectedSemester] = useState('1'); 
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    subjectName: '', dayOfWeek: 'Thứ 2', session: 'Sáng', 
    startPeriod: 1, numberOfPeriods: 3, room: '',
    startDate: '', endDate: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [noteModal, setNoteModal] = useState({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchData(parsedUser._id);
  }, [navigate]);

  const fetchData = async (userId) => {
    try {
      const [timetableRes, settingsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/timetable/${userId}`),
        axios.get(`http://localhost:5000/api/auth/settings/${userId}`)
      ]);
      
      if (timetableRes.data.success) setTimetables(timetableRes.data.data);
      
      let config = getFallbackSemesterConfig();
      if (settingsRes.data.success && settingsRes.data.settings?.semesterConfig) {
        config = settingsRes.data.settings.semesterConfig;
      }
      setSemesterConfig(config);
      
      const initialStart = config['1'].start;
      const initialEnd = config['1'].end;
      setSemesterStart(initialStart);
      setSemesterEnd(initialEnd);
      setFormData(prev => ({ ...prev, startDate: initialStart, endDate: initialEnd }));

    } catch (err) {
      console.error("Lỗi lấy dữ liệu", err);
    }
  };

  const handleSaveSemesterConfig = async () => {
    if (!semesterStart || !semesterEnd) {
      alert("Vui lòng không để trống ngày của Học kỳ!");
      return;
    }
    try {
      const currentSettings = JSON.parse(localStorage.getItem('user'))?.settings || {};
      const payload = { ...currentSettings, semesterConfig };
      await axios.put(`http://localhost:5000/api/auth/settings/${user._id}`, payload);
      const updatedUser = { ...user, settings: payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Đã lưu Cấu hình Khung thời gian Học kỳ thành công!');
    } catch (err) {
      alert('Lỗi khi lưu cấu hình Học kỳ vào Server!');
    }
  };

  const handleSemesterChange = (e) => {
    const val = e.target.value;
    setSelectedSemester(val);
    
    const newStart = semesterConfig[val]?.start || getFallbackSemesterConfig()[val].start;
    const newEnd = semesterConfig[val]?.end || getFallbackSemesterConfig()[val].end;
    
    setSemesterStart(newStart);
    setSemesterEnd(newEnd);
    setFormData(prev => ({ ...prev, startDate: newStart, endDate: newEnd }));
    handleCancelEdit();
  };

  const handleSessionChange = (e) => {
    const session = e.target.value;
    let defaultStart = session === 'Sáng' ? 1 : session === 'Chiều' ? 7 : null;
    setFormData({ ...formData, session, startPeriod: defaultStart });
  };

  // VALIDATION ĐỂ CHỐNG LỖI MÀN HÌNH TRẮNG & LỖI SERVER
  const handleSubmitSubject = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.startDate || !formData.endDate) {
      setError("⚠️ Lỗi: Bạn chưa chọn Ngày bắt đầu và Ngày kết thúc cho môn học!");
      return;
    }

    if (!semesterStart || !semesterEnd) {
      setError("⚠️ Lỗi: Khung ngày của Học kỳ đang bị trống. Vui lòng thiết lập ở trên!");
      return;
    }

    const semStart = new Date(semesterStart);
    const semEnd = new Date(semesterEnd);
    const subStart = new Date(formData.startDate);
    const subEnd = new Date(formData.endDate);

    semStart.setHours(0,0,0,0); semEnd.setHours(0,0,0,0);
    subStart.setHours(0,0,0,0); subEnd.setHours(0,0,0,0);

    if (subStart > subEnd) {
      setError("⚠️ Lỗi: Ngày bắt đầu môn KHÔNG ĐƯỢC lớn hơn ngày kết thúc!");
      return;
    }
    
    if (subStart < semStart || subEnd > semEnd) {
      setError(`⚠️ Lỗi: Môn học phải nằm trong Học kỳ (${formatDateForInput(semStart)} đến ${formatDateForInput(semEnd)}).`);
      return;
    }

    try {
      const payload = { ...formData, isNote: false, semester: selectedSemester, userId: user._id };
      let res;
      if (editingId) {
        res = await axios.put(`http://localhost:5000/api/timetable/update/${editingId}`, payload);
      } else {
        res = await axios.post('http://localhost:5000/api/timetable/add', payload);
      }

      if (res.data.success) {
        setSuccess(editingId ? 'Đã cập nhật môn học!' : 'Đã thêm môn học!');
        const updatedTimetables = await axios.get(`http://localhost:5000/api/timetable/${user._id}`);
        setTimetables(updatedTimetables.data.data);
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Server Crash Log:", err.response || err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra kết nối server! Kiểm tra lại dữ liệu.');
    }
  };

  const handleSaveNote = async () => {
    try {
      const payload = { 
        isNote: true, noteContent: noteModal.content, session: noteModal.session, 
        dayOfWeek: noteModal.day, startPeriod: noteModal.startPeriod, numberOfPeriods: 1, 
        isTemporary: noteModal.session === 'Tối', semester: selectedSemester, userId: user._id 
      };
      if (noteModal.noteId) await axios.put(`http://localhost:5000/api/timetable/update/${noteModal.noteId}`, payload);
      else await axios.post('http://localhost:5000/api/timetable/add', payload);
      
      const updatedTimetables = await axios.get(`http://localhost:5000/api/timetable/${user._id}`);
      setTimetables(updatedTimetables.data.data);
      setNoteModal({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null });
    } catch (err) { alert("Lỗi khi lưu ghi chú!"); }
  };

  const handleDelete = async (id, isNoteType = false) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa không? Dữ liệu lộ trình (nếu có) cũng sẽ bị xóa theo.")) return;
    try {

      const itemToDelete = timetables.find(t => t._id === id);
      await axios.delete(`http://localhost:5000/api/timetable/delete/${id}`);
      //  Xóa Roadmap của môn đó khỏi DB
      if (itemToDelete && !isNoteType) {
        try {
          await axios.delete(`http://localhost:5000/api/roadmap/${user._id}/${itemToDelete.semester}/${itemToDelete.subjectName}`);
        } catch (e) { console.log("Không có roadmap để xóa"); }
      }
      const updatedTimetables = await axios.get(`http://localhost:5000/api/timetable/${user._id}`);
      setTimetables(updatedTimetables.data.data);
      
      if (isNoteType) setNoteModal({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null });
      else setDetailModal({ isOpen: false, data: null });
    } catch (err) {
      alert("Lỗi khi xóa!");
    }
  };

  const handleEditSubject = (item) => {
    setDetailModal({ isOpen: false, data: null });
    setEditingId(item._id);
    
    setFormData({
      subjectName: item.subjectName, 
      dayOfWeek: item.dayOfWeek, 
      session: item.session,
      startPeriod: item.startPeriod, 
      numberOfPeriods: item.numberOfPeriods, 
      room: item.room || '',
      startDate: item.startDate ? formatDateForInput(item.startDate) : semesterStart,
      endDate: item.endDate ? formatDateForInput(item.endDate) : semesterEnd
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      subjectName: '', dayOfWeek: 'Thứ 2', session: 'Sáng', 
      startPeriod: 1, numberOfPeriods: 3, room: '',
      startDate: semesterStart, endDate: semesterEnd 
    });
  };

  const currentSemesterTimetables = timetables.filter(item => item.semester === selectedSemester);

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-fade-in relative">
      
      {/* POPUP CHI TIẾT */}
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
              
              <p className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-2 border-t border-gray-200 mt-2">
                 <span>Bắt đầu: {detailModal.data.startDate ? new Date(detailModal.data.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                 <span>Kết thúc: {detailModal.data.endDate ? new Date(detailModal.data.endDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleEditSubject(detailModal.data)} className="flex-1 bg-yellow-100 text-yellow-700 font-bold py-2.5 rounded-xl hover:bg-yellow-200 flex items-center justify-center gap-2"><Edit size={18}/> Sửa</button>
              <button onClick={() => handleDelete(detailModal.data._id)} className="flex-1 bg-red-100 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-200 flex items-center justify-center gap-2"><Trash2 size={18}/> Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP GHI CHÚ */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setNoteModal({ isOpen: false, day: '', session: '', startPeriod: null, content: '', noteId: null })} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X /></button>
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><StickyNote className="text-yellow-500"/> Ghi chú {noteModal.session} {noteModal.day}</h3>
            <textarea rows="4" placeholder="VD: Học nhóm thư viện..." value={noteModal.content} onChange={e => setNoteModal({...noteModal, content: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-yellow-300 bg-yellow-50/30 resize-none mt-2"/>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSaveNote} className="flex-[2] bg-yellow-500 text-white font-bold py-2.5 rounded-xl hover:bg-yellow-600 transition">Lưu</button>
              {noteModal.noteId && <button onClick={() => handleDelete(noteModal.noteId, true)} className="flex-1 bg-red-100 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-200 transition"><Trash2 className="mx-auto" size={20}/></button>}
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC CÀI ĐẶT HỌC KỲ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-2xl font-black text-blue-600 flex items-center gap-2 uppercase tracking-tight">Năm học {getSchoolYear()}</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Lưu ý: Bấm <strong className="text-green-600">Lưu Cấu Hình HK</strong> sau khi sửa đổi ngày tháng Học kỳ.</p>
          </div>
          <button 
            onClick={handleSaveSemesterConfig} 
            className="flex items-center gap-2 bg-green-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-100 hover:bg-green-600 transition active:scale-95"
          >
            <Save size={18} /> Lưu Cấu Hình HK
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-[10px] tracking-wider text-gray-400">Đang thao tác: Học kỳ</label>
            <select value={selectedSemester} onChange={handleSemesterChange} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none bg-white font-black text-blue-600 cursor-pointer">
              <option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option><option value="he">Học kỳ Hè</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-[10px] tracking-wider text-gray-400">Ngày Bắt đầu học kỳ</label>
            <input 
              type="date" required
              value={semesterStart} 
              onChange={e => {
                const val = e.target.value;
                setSemesterStart(val);
                setSemesterConfig(prev => ({ ...prev, [selectedSemester]: { ...prev[selectedSemester], start: val } }));
                if(!editingId) setFormData(prev => ({...prev, startDate: val}));
              }} 
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-[10px] tracking-wider text-gray-400">Ngày Kết thúc học kỳ</label>
            <input 
              type="date" required
              value={semesterEnd} 
              onChange={e => {
                const val = e.target.value;
                setSemesterEnd(val);
                setSemesterConfig(prev => ({ ...prev, [selectedSemester]: { ...prev[selectedSemester], end: val } }));
                if(!editingId) setFormData(prev => ({...prev, endDate: val}));
              }} 
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* FORM NHẬP LIỆU */}
        <div className={`xl:w-[350px] shrink-0 bg-white rounded-3xl shadow-sm border-2 p-6 h-fit sticky top-6 transition-all ${editingId ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-100'}`}>
          <h3 className={`font-bold text-lg mb-5 flex items-center gap-2 ${editingId ? 'text-yellow-600' : 'text-gray-800'}`}>
            {editingId ? '✏️ Cập nhật môn học' : '📚 Thêm môn học'}
          </h3>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[11px] leading-relaxed font-bold flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5"/> {error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold">{success}</div>}
          
          <form onSubmit={handleSubmitSubject} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Tên môn học</label>
              <input type="text" required placeholder="Toán rời rạc..." value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"/>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-2 rounded-xl border border-blue-50">
              <div>
                <label className="block text-[10px] font-bold text-blue-600 mb-1 uppercase">Bắt đầu học</label>
                <input 
                  type="date" required 
                  min={semesterStart} max={semesterEnd} 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  className="w-full p-2 bg-white border border-blue-100 rounded-lg text-xs font-bold text-gray-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-600 mb-1 uppercase">Kết thúc học</label>
                <input 
                  type="date" required 
                  min={semesterStart} max={semesterEnd} 
                  value={formData.endDate} 
                  onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  className="w-full p-2 bg-white border border-blue-100 rounded-lg text-xs font-bold text-gray-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Thứ</label>
                <select value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none font-medium text-sm">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Buổi</label>
                <select value={formData.session} onChange={handleSessionChange} className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none font-medium text-sm">
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {formData.session !== 'Tối' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Tiết bắt đầu</label>
                  <input type="number" min={formData.session === 'Sáng' ? 1 : 7} max={formData.session === 'Sáng' ? 6 : 12} value={formData.startPeriod} onChange={e => setFormData({...formData, startPeriod: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-blue-600"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Số tiết</label>
                  <input type="number" min="1" max="6" value={formData.numberOfPeriods} onChange={e => setFormData({...formData, numberOfPeriods: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-blue-600"/>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Phòng học</label>
              <input type="text" placeholder="A102" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full p-3 bg-gray-50 border-none rounded-xl outline-none text-sm font-medium"/>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className={`flex-1 text-white py-3.5 rounded-xl font-bold transition shadow-lg ${editingId ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                {editingId ? 'Lưu cập nhật' : 'Thêm mới'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-500 px-5 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition">Hủy</button>
              )}
            </div>
          </form>
        </div>

        {/* LƯỚI THỜI KHÓA BIỂU */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto p-5">
          <div className="min-w-[900px] bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, minmax(100px, 1fr))', gridTemplateRows: '45px repeat(6, 50px) 24px repeat(6, 50px) 24px 70px', gap: '1px' }}>
            <div className="bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-[10px] uppercase tracking-widest">Tiết</div>
            {DAYS.map((day) => (<div key={day} className="bg-gray-50 flex items-center justify-center font-bold text-gray-700 text-sm uppercase">{day}</div>))}

            {[1,2,3,4,5,6].map(p => <div key={`p${p}`} className="bg-white flex items-center justify-center text-xs font-bold text-gray-400" style={{ gridColumn: 1, gridRow: p + 1 }}>{p}</div>)}
            <div className="bg-gray-100" style={{ gridColumn: 1, gridRow: 8 }}></div>
            {[7,8,9,10,11,12].map(p => <div key={`p${p}`} className="bg-white flex items-center justify-center text-xs font-bold text-gray-400" style={{ gridColumn: 1, gridRow: p + 2 }}>{p}</div>)}
            <div className="bg-gray-100" style={{ gridColumn: 1, gridRow: 15 }}></div>
            <div className="bg-white flex items-center justify-center text-xs font-bold text-gray-400" style={{ gridColumn: 1, gridRow: 16 }}>Tối</div>

            <div className="bg-gray-100/80 flex items-center justify-center text-[10px] font-black text-gray-400 tracking-[0.5em]" style={{ gridColumn: '2 / span 7', gridRow: 8 }}>NGHỈ TRƯA</div>
            <div className="bg-gray-100/80 flex items-center justify-center text-[10px] font-black text-gray-400 tracking-[0.5em]" style={{ gridColumn: '2 / span 7', gridRow: 15 }}>NGHỈ CHIỀU</div>

            {DAYS.map((day, dIdx) => {
              const col = dIdx + 2;
              return (
                <React.Fragment key={`bg-${day}`}>
                  {[1,2,3,4,5,6].map(p => (<div key={`s-${p}`} className="bg-white hover:bg-blue-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: p + 1 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Sáng', startPeriod: p, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-blue-200 w-5 h-5"/></div>))}
                  {[7,8,9,10,11,12].map(p => (<div key={`c-${p}`} className="bg-white hover:bg-blue-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: p + 2 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Chiều', startPeriod: p, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-blue-200 w-5 h-5"/></div>))}
                  <div className="bg-white hover:bg-yellow-50/50 cursor-pointer group flex items-center justify-center transition-colors" style={{ gridColumn: col, gridRow: 16 }} onClick={() => setNoteModal({ isOpen: true, day, session: 'Tối', startPeriod: null, content: '', noteId: null })}><PlusCircle className="opacity-0 group-hover:opacity-100 text-yellow-200 w-6 h-6"/></div>
                </React.Fragment>
              )
            })}

            {currentSemesterTimetables.map((item) => {
              const col = getColForDay(item.dayOfWeek);
              const rowStart = getRowForPeriod(item.session, item.startPeriod);
              const rowSpan = getRowSpan(item.session, item.numberOfPeriods);

              return (
                <div
                  key={`item-${item._id}`} style={{ gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}` }}
                  onClick={() => item.isNote ? setNoteModal({ isOpen: true, day: item.dayOfWeek, session: item.session, startPeriod: item.startPeriod, content: item.noteContent, noteId: item._id }) : setDetailModal({ isOpen: true, data: item })}
                  className={`z-10 m-[2px] rounded-xl p-2 shadow-sm border flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${item.isNote ? 'bg-yellow-100/90 border-yellow-300 hover:bg-yellow-200' : 'bg-blue-100/90 border-blue-200 hover:bg-blue-200'}`}
                >
                  {item.isNote ? (
                    <span className="text-[11px] font-bold text-yellow-800 line-clamp-3 text-center w-full uppercase leading-tight">📝 {item.noteContent}</span>
                  ) : (
                    <>
                      <span className="font-black text-blue-900 text-[11px] text-center leading-tight line-clamp-2 uppercase">{item.subjectName}</span>
                      {item.room && (<div className="flex items-center justify-center gap-1 mt-1"><MapPin size={10} className="text-blue-500"/><span className="text-[10px] font-black text-blue-600">{item.room}</span></div>)}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableEntry;