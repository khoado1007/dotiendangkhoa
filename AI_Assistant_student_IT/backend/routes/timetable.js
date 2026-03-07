const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');

router.post('/add', async (req, res) => {
  try {
    const { userId, semester, dayOfWeek, session, isNote, subjectName, startPeriod, numberOfPeriods, room, noteContent } = req.body;
    
    // Nếu là Môn học (Không phải buổi Tối và không phải Ghi chú) thì kiểm tra trùng tiết
    if (!isNote && session !== 'Tối') {
      const newStart = parseInt(startPeriod);
      const newEnd = newStart + parseInt(numberOfPeriods) - 1;

      // Lấy các môn đã có trong cùng Buổi, Thứ, Học kỳ
      const existingClasses = await Timetable.find({ 
        userId, semester, dayOfWeek, session, isNote: false 
      });

      // Thuật toán kiểm tra giao nhau (Overlap)
      for (let cls of existingClasses) {
        const existStart = cls.startPeriod;
        const existEnd = cls.startPeriod + cls.numberOfPeriods - 1;

        if (newStart <= existEnd && newEnd >= existStart) {
          return res.status(400).json({ 
            success: false, 
            message: `Trùng lịch! Môn "${cls.subjectName}" đang chiếm từ tiết ${existStart} đến tiết ${existEnd}.` 
          });
        }
      }
    }

    const newSchedule = new Timetable(req.body);
    await newSchedule.save();
    
    res.json({ success: true, message: isNote ? 'Thêm ghi chú thành công!' : 'Thêm lịch học thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu.' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const schedules = await Timetable.find({ userId: req.params.userId });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu.' });
  }
});
router.put('/update/:id', async (req, res) => {
  try {
    const { userId, semester, dayOfWeek, session, isNote, subjectName, startPeriod, numberOfPeriods, room, noteContent } = req.body;
    
    // Nếu là Môn học thì kiểm tra trùng lịch (loại trừ chính nó)
    if (!isNote && session !== 'Tối') {
      const newStart = parseInt(startPeriod);
      const newEnd = newStart + parseInt(numberOfPeriods) - 1;

    
      const existingClasses = await Timetable.find({ 
        _id: { $ne: req.params.id }, // $ne là Not Equal (Không bằng)
        userId, semester, dayOfWeek, session, isNote: false 
      });

      for (let cls of existingClasses) {
        const existStart = cls.startPeriod;
        const existEnd = cls.startPeriod + cls.numberOfPeriods - 1;
        if (newStart <= existEnd && newEnd >= existStart) {
          return res.status(400).json({ 
            success: false, 
            message: `Trùng lịch! Môn "${cls.subjectName}" đã chiếm từ tiết ${existStart} đến ${existEnd}.` 
          });
        }
      }
    }

    // Tiến hành cập nhật
    const updatedSchedule = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Cập nhật thành công!', data: updatedSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật.' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa.' });
  }
});
module.exports = router;