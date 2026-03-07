import { calculateEndTime } from '../utils/timeHelper';

const ScheduleItem = ({ subject }) => {
  // Giả sử subject.startTime = "07:00" và subject.numberOfPeriods = 3
  const endTime = calculateEndTime(subject.startTime, subject.numberOfPeriods);

  return (
    <div className="p-4 border-l-4 border-blue-500 bg-white shadow-sm">
      <h3 className="font-bold text-lg">{subject.subjectName}</h3>
      <p className="text-gray-600">
        🕒 {subject.startTime} - {endTime} 
        <span className="ml-2 text-sm text-gray-400">({subject.numberOfPeriods} tiết)</span>
      </p>
      <p className="text-sm">Phòng: {subject.room}</p>
    </div>
  );
};