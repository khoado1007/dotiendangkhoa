import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Play, BookOpen, Clock, Target, CheckCircle2, XCircle, Code, ListChecks, Zap, RotateCcw, Calendar
} from 'lucide-react';
import { getCurrentSemester, getSchoolYear } from '../utils/timehelper';

const Practice = () => {
  const navigate = useNavigate();
  const { mode: urlMode } = useParams(); // Nhận 'review' hoặc 'exam' từ URL
  const API_URL = import.meta.env.VITE_API_URL ;
  const [user, setUser] = useState(null);
  
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [roadmaps, setRoadmaps] = useState({});
  const [activeSubject, setActiveSubject] = useState('');
  const [subjects, setSubjects] = useState([]); // Danh sách môn từ timetable
  
  const [viewState, setViewState] = useState('SELECT_TOPIC'); 
  const [activeTopic, setActiveTopic] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [dataSource, setDataSource] = useState(''); // Xem lấy từ DB hay AI
  const [subjectType, setSubjectType] = useState('QUIZ'); // CODE, DATABASE, or QUIZ
  
  const [userCode, setUserCode] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [score, setScore] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);

  // Exam history from localStorage
  const [examHistory, setExamHistory] = useState({});

  const isExamMode = urlMode === 'exam';
  const displayModeText = isExamMode ? 'KIỂM TRA' : 'LUYỆN TẬP';

  // Load exam history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('examHistory');
    if (stored) {
      setExamHistory(JSON.parse(stored));
    }
  }, []);

  // Save exam history to localStorage
  const saveExamResult = (subjectName, topicText, score, completed) => {
    const key = `${subjectName}-${topicText}`;
    const newHistory = {
      ...examHistory,
      [key]: {
        score,
        completed,
        date: new Date().toISOString(),
        canRetake: true
      }
    };
    setExamHistory(newHistory);
    localStorage.setItem('examHistory', JSON.stringify(newHistory));
  };

  // Check if topic has been completed
  const isTopicCompleted = (subjectName, topicText) => {
    const key = `${subjectName}-${topicText}`;
    return examHistory[key]?.completed || false;
  };

  useEffect(() => {
    // Reset view khi chuyển URL giữa Review và Exam
    setViewState('SELECT_TOPIC');
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Get current semester
    fetchSemesterConfig(parsedUser._id);
  }, [navigate, urlMode]);

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
      }
    } catch (err) {
      // Use default semester
      fetchData(userId, '1');
    }
  };

  const fetchData = async (userId, semester) => {
    try {
      // Fetch both timetable and roadmap with semester filter
      const [timetableRes, roadmapRes] = await Promise.all([
        axios.get(`${API_URL}/api/timetable/${userId}`),
        axios.get(`${API_URL}/api/roadmap/${userId}/${semester}`)
      ]);

      // Process subjects from timetable - filter by semester
      const subjectMap = new Map();
      if (timetableRes.data.success) {
        timetableRes.data.data
          .filter(t => t.semester === semester && !t.isNote)
          .forEach(item => {
            if (!subjectMap.has(item.subjectName)) {
              subjectMap.set(item.subjectName, item.subjectName);
            }
          });
      }
      setSubjects(Array.from(subjectMap.values()));

      // Process roadmaps
      const fetchedRoadmaps = {};
      if (roadmapRes.data.success) {
        roadmapRes.data.data.forEach(rm => {
          fetchedRoadmaps[rm.subjectName] = rm.todos;
        });
      }
      setRoadmaps(fetchedRoadmaps);
      
      // Set first subject as active if available
      if (subjectMap.size > 0) {
        setActiveSubject(Array.from(subjectMap.keys())[0]);
      } else if (Object.keys(fetchedRoadmaps).length > 0) {
        setActiveSubject(Object.keys(fetchedRoadmaps)[0]);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };

  const handleSemesterChange = (e) => {
    const newSemester = e.target.value;
    setSelectedSemester(newSemester);
    setViewState('SELECT_TOPIC');
    if (user) {
      fetchData(user._id, newSemester);
    }
  };

  const fetchRoadmaps = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/api/roadmap/${userId}/1`);
      if (res.data.success) {
        const fetchedRoadmaps = {};
        res.data.data.forEach(rm => { fetchedRoadmaps[rm.subjectName] = rm.todos; });
        setRoadmaps(fetchedRoadmaps);
        if(Object.keys(fetchedRoadmaps).length > 0) setActiveSubject(Object.keys(fetchedRoadmaps)[0]);
      }
    } catch (err) {}
  };

  useEffect(() => {
    let timerId;
    if (viewState === 'DOING' && isExamMode && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleSubmit(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [viewState, isExamMode, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startExercise = async (topic) => {
    setActiveTopic(topic);
    setViewState('LOADING');
    setExamCompleted(false);

    try {
      const res = await axios.post(`${API_URL}/api/practice/generate-exercise`, {
        subjectName: activeSubject,
        topicText: topic.text,
        mode: isExamMode ? 'EXAM' : 'REVIEW',
        semester: selectedSemester
      });

      const data = res.data.data;
      setExerciseData(data);
      setDataSource(res.data.source);
      setSubjectType(res.data.subjectType || 'QUIZ');
      
      // Set timer based on subject type: 60min for QUIZ, 75min for CODE/DATABASE
      const examTime = res.data.examTime || (res.data.subjectType === 'QUIZ' ? 60 : 75);
      setTimeLeft(isExamMode ? examTime * 60 : 0);
      
      if (data.type === 'CODE') {
        setUserCode(data.starterCode || '');
      }
      if (data.type === 'QUIZ') {
        // Randomize questions for quiz
        const questions = [...data.questions].sort(() => Math.random() - 0.5);
        setExerciseData({ ...data, questions });
        setQuizAnswers({});
      }
      
      setViewState('DOING');
    } catch (err) {
      alert("Lỗi khi tải bài tập. Vui lòng thử lại!");
      setViewState('SELECT_TOPIC');
    }
  };

  const handleSubmit = () => {
    let finalScore = 0;
    
    if (exerciseData.type === 'QUIZ') {
      let correctCount = 0;
      exerciseData.questions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correctIndex) correctCount++;
      });
      finalScore = Math.round((correctCount / exerciseData.questions.length) * 100);
    } else {
      // For CODE, random score for demo (in real app, would need code execution)
      finalScore = Math.floor(Math.random() * 40) + 60; 
    }
    
    setScore(finalScore);
    setExamCompleted(true);
    
    // Save result to localStorage
    if (isExamMode) {
      const passed = finalScore >= 50;
      saveExamResult(activeSubject, activeTopic.text, finalScore, passed);
    }
    
    setViewState('RESULT');
  };

  const retakeExam = () => {
    setViewState('SELECT_TOPIC');
    setExamCompleted(false);
  };

  const getLanguageExtension = (lang) => {
    if (lang === 'sql') return [sql()];
    if (lang === 'python') return [python()];
    return [javascript({ jsx: true })];
  };

  // ===============================================
  // VIEW 1: CHỌN CHỦ ĐỀ 
  // ===============================================
  if (viewState === 'SELECT_TOPIC') {
    // Combine subjects from timetable and roadmaps
    const allSubjects = subjects.length > 0 ? subjects : Object.keys(roadmaps);
    const hasRoadmap = (sub) => roadmaps[sub] && roadmaps[sub].length > 0;

    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <Target className={isExamMode ? "text-red-600" : "text-blue-600"}/> Chế độ: {displayModeText}
            </h1>
            <p className="text-gray-500 font-medium mt-1">Dữ liệu được trích xuất từ Hệ sinh thái dùng chung (Global Pool).</p>
          </div>
          
          {/* Semester Selector */}
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <Calendar size={18} className="text-gray-400 ml-2"/>
            <span className="text-xs font-bold text-gray-500 uppercase px-2">Kỳ học:</span>
            <select 
              value={selectedSemester} 
              onChange={handleSemesterChange} 
              className="p-2.5 bg-white border border-gray-200 rounded-xl font-black text-indigo-700 outline-none cursor-pointer shadow-sm"
            >
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="he">Học kỳ Hè</option>
            </select>
          </div>
        </div>

        {allSubjects.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-black text-gray-600">Chưa có môn học</h3>
            <p className="text-gray-400 mt-2 text-sm">Hãy thêm môn học ở trang Quản lý Thời khóa biểu trước nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 px-2 uppercase tracking-wider text-xs">Môn học - HK{selectedSemester}</h3>
              <div className="space-y-2">
                {allSubjects.map(sub => (
                  <button 
                    key={sub} 
                    onClick={() => setActiveSubject(sub)} 
                    className={`w-full text-left p-3 rounded-xl font-bold transition-all ${activeSubject === sub ? (isExamMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200') : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              {hasRoadmap(activeSubject) ? (
                roadmaps[activeSubject]?.map((topic, idx) => {
                  const completed = isTopicCompleted(activeSubject, topic.text);
                  return (
                    <div key={topic.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group transition ${isExamMode ? 'hover:border-red-200' : 'hover:border-blue-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center shrink-0 ${completed && isExamMode ? 'bg-green-100 text-green-600' : (isExamMode ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}`}>
                          {completed && isExamMode ? <CheckCircle2 size={20}/> : idx + 1}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800 text-lg leading-tight">{topic.text}</h4>
                          {completed && isExamMode && (
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle2 size={12}/> Đã hoàn thành
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => startExercise(topic)} 
                        className={`w-full md:w-auto font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 ${completed && isExamMode ? 'bg-green-600 text-white hover:bg-green-700' : (isExamMode ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100')}`}
                      >
                        {completed && isExamMode ? <RotateCcw size={18}/> : (isExamMode ? <Clock size={18}/> : <BookOpen size={18}/>)} 
                        {completed && isExamMode ? 'Làm lại' : `Bắt đầu ${isExamMode ? 'Thi' : 'Luyện'}`}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-black text-gray-600">Chưa có lộ trình</h3>
                  <p className="text-gray-400 mt-2 text-sm">Vui lòng tạo lộ trình ở trang Roadmap trước để luyện tập.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===============================================
  // VIEW 2: LOADING VÀ BÁO SOURCE
  // ===============================================
  if (viewState === 'LOADING') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-pulse">
        <Code size={48} className="text-blue-500 mb-4 animate-spin"/>
        <h2 className="text-xl font-black text-gray-700">Hệ thống đang chuẩn bị đề...</h2>
        <p className="text-gray-400 mt-2 text-sm">Tìm kiếm trong Global Pool hoặc AI Generation</p>
      </div>
    );
  }

  // ===============================================
  // VIEW 3: LÀM BÀI 
  // ===============================================
  if (viewState === 'DOING' && exerciseData) {
    const isCode = exerciseData.type === 'CODE';

    return (
      <div className={`min-h-screen ${isCode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'} animate-fade-in flex flex-col`}>
        <div className={`p-4 flex justify-between items-center border-b ${isCode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white shadow-sm'} sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setViewState('SELECT_TOPIC')} className={`font-bold text-sm ${isCode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-600'}`}>Thoát</button>
            
            <span className={`font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-lg ${isExamMode ? 'bg-red-500/20 text-red-500' : (isCode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')}`}>
              {displayModeText}
            </span>
            
            <span className={`font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-lg ${
              subjectType === 'QUIZ' ? 'bg-purple-500/20 text-purple-500' : 
              subjectType === 'DATABASE' ? 'bg-orange-500/20 text-orange-500' :
              'bg-green-500/20 text-green-500'
            }`}>
              {subjectType}
            </span>
            
            {/* HIỂN THỊ NGUỒN DATA ĐỂ BẠN THẤY SỰ LỢI HẠI CỦA CACHE */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md uppercase tracking-wider">
               <Zap size={12}/> Load từ {dataSource === 'database' ? 'Global DB' : 'AI Gen'}
            </span>
          </div>

          {isExamMode && (
            <div className="flex items-center gap-2 font-black text-red-500 bg-red-500/10 px-4 py-1.5 rounded-xl border border-red-500/20">
              <Clock size={18} className={timeLeft < 300 ? 'animate-pulse' : ''} /> {formatTime(timeLeft)}
            </div>
          )}

          <button onClick={handleSubmit} className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-600/30 flex items-center gap-2">
            <Play size={16} fill="currentColor"/> Nộp bài
          </button>
        </div>

        {/* NỘI DUNG CODE LEETCODE STYLE */}
        {isCode ? (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <div className="md:w-1/3 border-r border-gray-800 p-6 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-3 mb-4">
                 <h2 className="text-xl font-bold text-white">{activeTopic.text}</h2>
                 <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">{exerciseData.level}</span>
               </div>
               <div className="prose prose-invert text-sm max-w-none text-gray-400 leading-relaxed whitespace-pre-wrap">
                 {exerciseData.problem}
               </div>
               <div className="mt-8 space-y-3">
                 <h3 className="font-bold text-white uppercase text-xs tracking-widest">Test Cases</h3>
                 {exerciseData.testCases?.map((tc, i) => (
                   <div key={i} className="bg-gray-800/50 p-4 rounded-xl font-mono text-xs text-gray-300 whitespace-pre-wrap border border-gray-700/50">{tc}</div>
                 ))}
               </div>
            </div>
            
            <div className="md:w-2/3 flex flex-col bg-[#282c34]">
               <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                 <Code size={14} className="text-blue-400"/>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{exerciseData.language || 'javascript'}</span>
               </div>
               <div className="flex-1 overflow-hidden text-base">
                 <CodeMirror value={userCode} height="100%" theme={oneDark} extensions={getLanguageExtension(exerciseData.language)} onChange={(val) => setUserCode(val)} className="h-full" />
               </div>
            </div>
          </div>
        ) : (
          /* NỘI DUNG QUIZZI STYLE */
          <div className="flex-1 max-w-3xl mx-auto w-full p-6 pb-20">
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100">
               <h2 className="text-xl font-black text-gray-800 mb-8 border-b pb-4"><ListChecks className="inline mr-2 text-indigo-500"/> {activeTopic.text}</h2>
               
               <div className="space-y-10">
                 {exerciseData.questions?.map((q, qIndex) => (
                   <div key={qIndex} className="space-y-4">
                     <h3 className="font-bold text-gray-800 text-lg leading-relaxed"><span className="text-indigo-500 mr-1">Câu {qIndex + 1}:</span> {q.question}</h3>
                     <div className="grid grid-cols-1 gap-3">
                       {q.options.map((opt, oIndex) => {
                         const isSelected = quizAnswers[qIndex] === oIndex;
                         return (
                           <button 
                             key={oIndex}
                             onClick={() => setQuizAnswers({...quizAnswers, [qIndex]: oIndex})}
                             className={`text-left p-4 rounded-2xl border-2 transition-all font-medium ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-md' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}
                           >
                             <span className={`inline-block w-6 h-6 text-center rounded-full mr-3 text-sm leading-6 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                               {String.fromCharCode(65 + oIndex)}
                             </span>
                             {opt}
                           </button>
                         )
                       })}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===============================================
  // VIEW 4: KẾT QUẢ
  // ===============================================
  if (viewState === 'RESULT') {
    const passed = score >= 50;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 max-w-md w-full text-center">
          {passed ? (
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48}/></div>
          ) : (
            <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle size={48}/></div>
          )}
          
          <h2 className="text-3xl font-black text-gray-800 mb-2">Hoàn thành {displayModeText}!</h2>
          <p className="text-gray-500 font-medium mb-6">Bạn đã hoàn tất chủ đề: <br/><strong className="text-gray-700">{activeTopic.text}</strong></p>
          
          <div className="bg-gray-50 p-6 rounded-3xl mb-8">
            <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Điểm số của bạn</span>
            <span className={`text-6xl font-black ${passed ? 'text-green-600' : 'text-orange-500'}`}>{score}</span>
            <span className="text-xl font-bold text-gray-400">/100</span>
          </div>

          {isExamMode && (
            <div className="mb-6">
              {passed ? (
                <p className="text-green-600 font-bold">Chúc mừng! Bạn đã đạt kết quả tốt!</p>
              ) : (
                <p className="text-orange-600 font-bold">Bạn có thể làm lại để cải thiện điểm số!</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={retakeExam} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl flex items-center justify-center gap-2">
              <RotateCcw size={20}/> Làm lại
            </button>
            <button onClick={() => setViewState('SELECT_TOPIC')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition shadow-xl">
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Practice;

