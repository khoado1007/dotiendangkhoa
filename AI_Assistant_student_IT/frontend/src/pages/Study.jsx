import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, GraduationCap, FileText, Video, Link as LinkIcon, 
  ChevronDown, ChevronUp, Sparkles, Loader2, Building2, Globe, 
  AlertCircle, CheckCircle2, RefreshCw, ExternalLink
} from 'lucide-react';
import { getCurrentSemester, getSchoolYear } from '../utils/timehelper';

const Study = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [materials, setMaterials] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingSubject, setGeneratingSubject] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
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
        fetchMaterials(userId, current);
      }
    } catch (err) {
      fetchMaterials(userId, '1');
    }
  };

  const fetchMaterials = async (userId, semester) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/materials/${userId}`, {
        params: { semester }
      });
      
      if (res.data.success) {
        setMaterials(res.data.data);
        setSchoolName(res.data.schoolName);
      }
    } catch (err) {
      console.error("Lỗi lấy materials:", err);
      setError('Không thể tải dữ liệu tài liệu học tập');
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (e) => {
    const newSemester = e.target.value;
    setSelectedSemester(newSemester);
    if (user) {
      fetchMaterials(user._id, newSemester);
    }
  };

  const handleGenerateMaterials = async (subjectName) => {
    try {
      setGeneratingSubject(subjectName);
      const res = await axios.post(`${API_URL}/api/materials/generate`, {
        subjectName,
        semester: selectedSemester,
        userId: user._id
      });

      if (res.data.success) {
        // Refresh materials list
        fetchMaterials(user._id, selectedSemester);
      }
    } catch (err) {
      console.error("Lỗi generate materials:", err);
      alert('Không thể tạo tài liệu. Vui lòng thử lại.');
    } finally {
      setGeneratingSubject(null);
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'school':
        return <Building2 size={14} className="text-blue-600" />;
      case 'internet':
        return <Globe size={14} className="text-green-600" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'school':
        return 'Trường bạn';
      case 'internet':
        return 'Internet';
      default:
        return 'Chưa có';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'school':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'internet':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-pulse">
        <GraduationCap size={48} className="text-indigo-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-gray-700">Đang tải tài liệu học tập...</h2>
        <p className="text-gray-400 mt-2 text-sm">Tìm kiếm tài liệu theo thứ tự ưu tiên</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Tài liệu học tập
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Tài liệu được ưu tiên: Trường bạn → Internet → AI Tạo
          </p>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <GraduationCap size={18} className="text-gray-400 ml-2" />
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

      {/* School Info */}
      {schoolName && (
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
          <Building2 size={20} className="text-blue-600" />
          <span className="text-sm font-bold text-blue-800">
            Trường của bạn: <span className="font-black">{schoolName}</span>
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-sm font-bold text-red-700">{error}</span>
        </div>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-black text-gray-600">Chưa có môn học</h3>
          <p className="text-gray-400 mt-2 text-sm">
            Hãy thêm môn học ở trang Quản lý Thời khóa biểu trước nhé.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
            >
              {/* Subject Header */}
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => setExpandedSubject(expandedSubject === item.subjectName ? null : item.subjectName)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">{item.subjectName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${getSourceColor(item.source)}`}>
                        {getSourceIcon(item.source)}
                        {getSourceLabel(item.source)}
                      </span>
                      {item.hasSchoolMaterial && item.hasInternetMaterial && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-500" /> Có tài liệu từ trường & internet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {item.source === 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateMaterials(item.subjectName);
                      }}
                      disabled={generatingSubject === item.subjectName}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {generatingSubject === item.subjectName ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Tạo tài liệu AI
                        </>
                      )}
                    </button>
                  )}
                  {expandedSubject === item.subjectName ? (
                    <ChevronUp size={24} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedSubject === item.subjectName && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-6">
                  {/* School Materials */}
                  {item.schoolMaterial && (
                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 size={18} className="text-blue-600" />
                        <h4 className="font-black text-blue-800">Tài liệu từ trường bạn</h4>
                      </div>
                      
                      {item.schoolMaterial.summary && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Tóm tắt</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.schoolMaterial.summary}</p>
                        </div>
                      )}
                      
                      {item.schoolMaterial.notes && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Ghi chú</h5>
                          <div className="bg-blue-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
                            {item.schoolMaterial.notes}
                          </div>
                        </div>
                      )}
                      
                      {item.schoolMaterial.tutorials && item.schoolMaterial.tutorials.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Video/Tutorial</h5>
                          <div className="space-y-2">
                            {item.schoolMaterial.tutorials.map((tut, i) => (
                              <a
                                key={i}
                                href={tut}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition"
                              >
                                <Video size={14} />
                                <span className="line-clamp-1">{tut}</span>
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.schoolMaterial.references && item.schoolMaterial.references.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Tài liệu tham khảo</h5>
                          <div className="space-y-2">
                            {item.schoolMaterial.references.map((ref, i) => (
                              <a
                                key={i}
                                href={ref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition"
                              >
                                <LinkIcon size={14} />
                                <span className="line-clamp-1">{ref}</span>
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Internet Materials */}
                  {item.internetMaterial && (
                    <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe size={18} className="text-green-600" />
                        <h4 className="font-black text-green-800">Tài liệu từ Internet</h4>
                      </div>
                      
                      {item.internetMaterial.summary && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Tóm tắt</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.internetMaterial.summary}</p>
                        </div>
                      )}
                      
                      {item.internetMaterial.notes && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Ghi chú</h5>
                          <div className="bg-green-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
                            {item.internetMaterial.notes}
                          </div>
                        </div>
                      )}
                      
                      {item.internetMaterial.tutorials && item.internetMaterial.tutorials.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Video/Tutorial</h5>
                          <div className="space-y-2">
                            {item.internetMaterial.tutorials.map((tut, i) => (
                              <a
                                key={i}
                                href={tut}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 transition"
                              >
                                <Video size={14} />
                                <span className="line-clamp-1">{tut}</span>
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.internetMaterial.references && item.internetMaterial.references.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Tài liệu từ các trường khác</h5>
                          <div className="space-y-2">
                            {item.internetMaterial.references.map((ref, i) => (
                              <a
                                key={i}
                                href={ref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 transition"
                              >
                                <LinkIcon size={14} />
                                <span className="line-clamp-1">{ref}</span>
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Materials - Generate AI */}
                  {item.source === 'none' && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-center">
                      <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
                      <h4 className="font-black text-amber-800 mb-2">Chưa có tài liệu</h4>
                      <p className="text-sm text-amber-700 mb-4">
                        Hệ thống sẽ tự động tìm kiếm tài liệu từ trường bạn và internet. 
                        Nếu không tìm thấy, bạn có thể yêu cầu AI tạo tài liệu mẫu.
                      </p>
                      <button
                        onClick={() => handleGenerateMaterials(item.subjectName)}
                        disabled={generatingSubject === item.subjectName}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
                      >
                        {generatingSubject === item.subjectName ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang tạo tài liệu...
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            Tạo tài liệu với AI
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Study;

