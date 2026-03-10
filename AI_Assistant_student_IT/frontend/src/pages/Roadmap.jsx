import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, BookOpen, AlertTriangle, CheckCircle2, Circle, 
  GraduationCap, Calendar as CalendarIcon, ChevronLeft, ArrowRight, RefreshCw 
} from 'lucide-react';
import { getSchoolYear, getCurrentSemester } from '../utils/timehelper';

const Roadmap = () => {
  // Sử dụng biến môi trường hoặc mặc định là localhost
  const API_URL = import.meta.env.VITE_API_URL ;

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [subjects, setSubjects] = useState([]); // Danh sách môn học
  const [roadmaps, setRoadmaps] = useState({}); // Dữ liệu Lộ trình AI
  
  // UX MỚI: DÙNG ĐỂ CHUYỂN ĐỔI GIỮA DANH SÁCH VÀ CHI TIẾT
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' hoặc 'DETAIL'
  const [activeSubject, setActiveSubject] = useState(null); // Môn học đang xem chi tiết
  const [generating, setGenerating] = useState(false); 

useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Get semester config and detect current semester
    fetchSemesterConfig(parsedUser._id);
  }, [navigate]);

  const fetchSemesterConfig = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/api/semester/${userId}`);
      if (res.data.success) {
        const config = {
          '1': { start: res.data.data.semester1_start, end: res.data.data.semester1_end },
          '2': { start: res.data.data.semester2_start, end: res.data.data.semester2_end },
          'he': { start: res.data.data.semester_he_start, end: res.data.data.semester_he_end }
        };
        const current = getCurrentSemester(config);
        setSelectedSemester(current);
        fetchData(userId, current);
      } else {
        // Fallback to default semester 1
        fetchData(userId, '1');
      }
    } catch (err) {
      // Use default semester 1 if error
      fetchData(userId, '1');
    }
  };

  const fetchData = async (userId, semester) => {
    setLoading(true);
    try {
      const [timetableRes, roadmapRes] = await Promise.all([
        axios.get(`${API_URL}/api/timetable/${userId}`),
        axios.get(`${API_URL}/api/roadmap/${userId}/${semester}`)
      ]);
      
      // Map Lộ trình từ DB
      const fetchedRoadmaps = {}; 
      if (roadmapRes.data.success) {
        roadmapRes.data.data.forEach(rm => {
          fetchedRoadmaps[rm.subjectName] = rm.todos;
        });
      }
      setRoadmaps(fetchedRoadmaps);

      // Lọc danh sách môn học duy nhất
      if (timetableRes.data.success) {
        processSubjects(timetableRes.data.data, semester);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (e) => {
    const val = e.target.value;
    setSelectedSemester(val);
    setViewMode('LIST'); // Quay lại danh sách nếu đổi kỳ
    setActiveSubject(null);
    if (user) fetchData(user._id, val);
  };

  const processSubjects = (allData, currentSemester) => {
    const subjectMap = new Map();

    allData.filter(t => t.semester === currentSemester && !t.isNote).forEach(item => {
      if (!subjectMap.has(item.subjectName)) {
        subjectMap.set(item.subjectName, { 
          name: item.subjectName, 
          endDate: new Date(item.endDate) 
        });
      } else {
        const existingEnd = subjectMap.get(item.subjectName).endDate;
        const newEnd = new Date(item.endDate);
        if (newEnd > existingEnd) subjectMap.get(item.subjectName).endDate = newEnd;
      }
    });

    setSubjects(Array.from(subjectMap.values()));
  };

  // Mở trang chi tiết của 1 môn
  const openSubjectDetail = (sub) => {
    setActiveSubject(sub);
    setViewMode('DETAIL');
  };

  // Quay lại danh sách
  const handleBackToList = () => {
    setViewMode('LIST');
    setActiveSubject(null);
  };

  // GỌI AI VÀ LƯU VÀO DB
  const generateAIPath = async () => {
    if (!activeSubject) return;
    setGenerating(true);
    try {
      const aiRes = await axios.post(`${API_URL}/api/roadmap/generate-ai`, { 
        subjectName: activeSubject.name 
      });
      
      if (!aiRes.data.success) throw new Error("AI không phản hồi hợp lệ");

      // Ép kiểu ID sang Chuỗi (String) cực độc nhất để chống lỗi tick 1 dính toàn bộ
      const generatedChecklist = aiRes.data.data.map((item, index) => ({
        id: `task-${Date.now()}-${index}`, 
        text: item.text,
        isCompleted: false
      }));

      await axios.post(`${API_URL}/api/roadmap/save`, { 
        userId: user._id, 
        semester: selectedSemester, 
        subjectName: activeSubject.name, 
        todos: generatedChecklist 
      });

      setRoadmaps({ ...roadmaps, [activeSubject.name]: generatedChecklist });
    } catch (err) {
      alert('Lỗi kết nối AI. Vui lòng thử lại!');
    } finally {
      setGenerating(false); 
    }
  };

  // TICK HOÀN THÀNH TASK
  const toggleTodo = async (taskId) => {
    const subjectName = activeSubject.name;
    const updatedTasks = roadmaps[subjectName].map(task => 
      String(task.id) === String(taskId) ? { ...task, isCompleted: !task.isCompleted } : task
    );
    
    setRoadmaps({ ...roadmaps, [subjectName]: updatedTasks });

    try {
      await axios.put(`${API_URL}/api/roadmap/toggle`, {
        userId: user._id, 
        semester: selectedSemester, 
        subjectName, 
        taskId: String(taskId)
      });
    } catch (err) {
      console.error("Lỗi cập nhật Task:", err);
    }
  };

  const getExamAlert = () => {
    if (!activeSubject) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(activeSubject.endDate);
    end.setHours(23,59,59,999);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // ĐIỀU KIỆN ẨN/HIỆN: Chỉ hiện khi còn <= 14 ngày VÀ >= 0 ngày (Chưa thi xong)
    if (diffDays >= 0 && diffDays <= 14) {
      return { daysLeft: diffDays, date: end.toLocaleDateString('vi-VN') };
    }
    return null; // Tự động ẩn nếu > 14 ngày hoặc đã qua môn
  };

  if (loading) return <div className="p-10 text-center font-bold text-indigo-600 animate-pulse flex flex-col items-center justify-center min-h-[60vh]"><Sparkles size={40} className="mb-4 animate-spin"/> Đang đồng bộ hệ thống...</div>;

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-h-[calc(100vh-80px)] bg-gray-50/50 space-y-8 animate-fade-in">
      
      {/* HEADER CHUNG */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-center">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">AI Study Space</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Năm học {getSchoolYear()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
           <span className="text-xs font-bold text-gray-500 uppercase px-2">Kỳ học:</span>
           <select value={selectedSemester} onChange={handleSemesterChange} className="p-2.5 bg-white border border-gray-200 rounded-xl font-black text-indigo-700 outline-none cursor-pointer shadow-sm">
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="he">Học kỳ Hè</option>
           </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: DANH SÁCH MÔN HỌC (KHÔNG CÓ LỘ TRÌNH/CẢNH BÁO Ở ĐÂY) */}
      {/* ========================================================= */}
      {viewMode === 'LIST' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-800 px-2">📚 Danh sách môn học:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.length > 0 ? subjects.map((sub, idx) => {
              const hasRoadmap = !!roadmaps[sub.name];
              return (
                <div 
                  key={idx} 
                  onClick={() => openSubjectDetail(sub)}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col h-full"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${hasRoadmap ? 'bg-green-500' : 'bg-gray-200 group-hover:bg-indigo-400'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-gray-800 text-lg pr-4 line-clamp-2 leading-tight">{sub.name}</h3>
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                      <GraduationCap size={24} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${hasRoadmap ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {hasRoadmap ? '✓ Đã có lộ trình' : 'Chưa khởi tạo AI'}
                    </span>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-1"/>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-black text-gray-600">Học kỳ này trống</h3>
                <p className="text-gray-400 mt-2 text-sm">Hãy thêm môn học ở trang Quản lý trước nhé.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CHI TIẾT MÔN HỌC (CÓ LỘ TRÌNH VÀ CẢNH BÁO THI)      */}
      {/* ========================================================= */}
      {viewMode === 'DETAIL' && activeSubject && (
        <div className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 p-6 md:p-10 animate-fade-in flex flex-col min-h-[600px] relative overflow-hidden">
          
          {/* Nút Back */}
          <button onClick={handleBackToList} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold w-fit mb-8 transition-colors bg-gray-50 hover:bg-indigo-50 px-5 py-2.5 rounded-xl text-sm">
            <ChevronLeft size={18} /> Quay lại danh sách
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight mb-3">{activeSubject.name}</h2>
              <div className="flex items-center gap-4">
                 <p className="text-gray-500 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-sm w-fit">
                   <CalendarIcon size={16} className="text-gray-400"/> Hạn kết thúc môn: <span className="font-bold text-gray-700">{activeSubject.endDate.toLocaleDateString('vi-VN')}</span>
                 </p>
                 
                 {/* Nút Tạo Lại (Chỉ hiện khi đã có Lộ trình) */}
                 {roadmaps[activeSubject.name] && (
                    <button onClick={generateAIPath} title="Tạo lại lộ trình AI khác" className={`text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${generating ? 'opacity-50 pointer-events-none' : ''}`}>
                       <RefreshCw size={16} className={generating ? "animate-spin" : ""} /> Tạo mới lộ trình
                    </button>
                 )}
              </div>
            </div>

            {/* NHÚNG CẢNH BÁO THI ĐỘC LẬP TỪNG MÔN */}
            {getExamAlert() && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 md:p-5 rounded-2xl flex items-center gap-4 shrink-0 shadow-sm animate-pulse">
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-red-800 font-black uppercase text-sm tracking-widest">Báo động ôn thi</h4>
                  <p className="text-red-600 text-sm font-bold mt-0.5">Chỉ còn <span className="text-xl md:text-2xl">{getExamAlert().daysLeft}</span> ngày!</p>
                </div>
              </div>
            )}
          </div>

          {/* KHU VỰC TODO LIST & AI */}
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            {roadmaps[activeSubject.name] ? (
              <div className="flex-1 flex flex-col space-y-8">
                {/* THANH TIẾN ĐỘ */}
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={18}/> Tiến độ chinh phục
                    </span>
                    <span className="text-xl font-black text-indigo-600">
                      {Math.round((roadmaps[activeSubject.name].filter(t => t.isCompleted).length / roadmaps[activeSubject.name].length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out relative" 
                      style={{ width: `${Math.round((roadmaps[activeSubject.name].filter(t => t.isCompleted).length / roadmaps[activeSubject.name].length) * 100)}%` }}
                    >
                       {/* Hiệu ứng bóng bẩy trên thanh tiến độ */}
                       <div className="absolute top-0 left-0 w-full h-full bg-white/20"></div>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH CHECKLIST TRẢ VỀ TỪ A.I */}
                <div className="space-y-4 flex-1">
                  {roadmaps[activeSubject.name].map((task, idx) => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTodo(task.id)}
                      className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-indigo-50 hover:border-indigo-200 hover:shadow-md'}`}
                    >
                      <div className="mt-0.5 shrink-0 transition-transform active:scale-75">
                        {task.isCompleted ? <CheckCircle2 size={26} className="text-green-500" /> : <Circle size={26} className="text-gray-300" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bước {idx + 1}</span>
                        <span className={`text-base font-bold transition-all leading-relaxed ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {task.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* TRẠNG THÁI CHƯA CÓ LỘ TRÌNH (HIỆN NÚT GỌI AI) */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 mt-10">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-indigo-100/50">
                  <Sparkles size={48} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-3">Triển khai Lộ trình A.I</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
                  Nhấp vào nút bên dưới để Trợ lý AI phân tích và vạch ra chiến lược ôn tập từng bước cụ thể cho môn <strong>{activeSubject.name}</strong>.
                </p>
                
                <button 
                  onClick={generateAIPath}
                  disabled={generating}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-lg disabled:opacity-70 disabled:cursor-wait"
                >
                  {generating ? (
                    <><Sparkles size={24} className="animate-spin" /> Đang phân tích chuyên sâu...</>
                  ) : (
                    <><Sparkles size={24} /> Bắt đầu tạo lộ trình</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Roadmap;