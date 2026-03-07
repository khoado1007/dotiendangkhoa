export const getSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${year} - ${year + 1}` : `${year - 1} - ${year}`;
};

export const calculateTotalWeeks = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7) || 1;
};

export const getWeekDateRange = (semesterStartStr, weekNumber) => {
  const start = new Date(semesterStartStr);
  if (isNaN(start.getTime())) return { weekStart: new Date(), weekEnd: new Date() };
  
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { weekStart: start, weekEnd: end };
};

export const isSubjectActiveInWeek = (subjectStartStr, subjectEndStr, weekStart, weekEnd) => {
  if (!subjectStartStr || !subjectEndStr) return true;
  const sStart = new Date(subjectStartStr);
  const sEnd = new Date(subjectEndStr);
  if (isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) return true;
  
  sStart.setHours(0,0,0,0);
  sEnd.setHours(23,59,59,999);
  
  return sStart <= weekEnd && sEnd >= weekStart;
};

export const isNoteInViewedWeek = (createdAt, weekStart, weekEnd) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return false;
  return created >= weekStart && created <= weekEnd;
};

export const isSubjectActive = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
  return now >= start && now <= end;
};

export const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};