/**
 * Logic: Mỗi tiết 50 phút. 
 * Tính giờ kết thúc dựa trên giờ bắt đầu và số tiết.
 */
export const calculateEndTime = (startTime, numberOfPeriods) => {
  if (!startTime || !numberOfPeriods) return "";

  const [hours, minutes] = startTime.split(':').map(Number);
  const startInMinutes = hours * 60 + minutes;
  
  // Tổng thời gian = số tiết * 50 phút
  const durationInMinutes = numberOfPeriods * 50;
  const endInMinutes = startInMinutes + durationInMinutes;

  const endHours = Math.floor(endInMinutes / 60);
  const endMinutes = endInMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};