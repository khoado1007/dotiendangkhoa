/**
 * Seed Materials Data - Run this after main seeding
 * Run: node seed_materials.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Exercise = require('./models/Exercise');

const seedMaterials = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KHOA';
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB...");

    // Check if materials already exist
    const existing = await Exercise.countDocuments({ 
      topicText: 'Tổng hợp tài liệu' 
    });
    
    if (existing > 0) {
      console.log("ℹ️ Materials already exist, skipping...");
      process.exit();
    }

    // Create materials
    await Exercise.create([
      {
        subjectName: 'Nhập môn lập trình',
        topicText: 'Tổng hợp tài liệu',
        semester: '1',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        sourceType: 'internet',
        schoolName: 'Internet',
        materials: {
          summary: 'Môn học nền tảng về lập trình.',
          notes: '1. Biến và Kiểu dữ liệu\n2. Cấu trúc điều khiển\n3. Hàm\n4. Mảng\n5. Object',
          tutorials: ['Lập trình Cơ bản - https://www.youtube.com/watch?v=zOjov-2OZ0E'],
          references: ['W3Schools - https://www.w3schools.com/js/']
        },
        data: { type: 'MATERIALS' }
      },
      {
        subjectName: 'Cấu trúc dữ liệu và Giải thuật',
        topicText: 'Tổng hợp tài liệu',
        semester: '1',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        sourceType: 'internet',
        schoolName: 'Internet',
        materials: {
          summary: 'Cách tổ chức và lưu trữ dữ liệu.',
          notes: '1. Big O\n2. Array, List, Stack\n3. Cây\n4. Sắp xếp\n5. Đồ thị',
          tutorials: ['DSA Course - https://www.youtube.com/watch?v=RBSGKlAvoiM'],
          references: ['GeeksforGeeks - https://www.geeksforgeeks.org/']
        },
        data: { type: 'MATERIALS' }
      },
      {
        subjectName: 'Toán rời rạc',
        topicText: 'Tổng hợp tài liệu',
        semester: '1',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        sourceType: 'internet',
        schoolName: 'Internet',
        materials: {
          summary: 'Nền tảng cho khoa học máy tính.',
          notes: '1. Logic\n2. Tập hợp\n3. Quan hệ\n4. Đại số Boole\n5. Đồ thị',
          tutorials: ['Discrete Math - https://www.youtube.com/watch?v=13WSLk7HlAQ'],
          references: ['Khan Academy - https://www.khanacademy.org/']
        },
        data: { type: 'MATERIALS' }
      },
      {
        subjectName: 'Mạng máy tính',
        topicText: 'Tổng hợp tài liệu',
        semester: '2',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        sourceType: 'internet',
        schoolName: 'Internet',
        materials: {
          summary: 'Giao thức truyền thông mạng.',
          notes: '1. OSI\n2. TCP/IP\n3. IP\n4. HTTP\n5. Thiết bị',
          tutorials: ['Networking - https://www.youtube.com/watch?v=qiQR5rTSshw'],
          references: ['Cisco - https://www.netacad.com/']
        },
        data: { type: 'MATERIALS' }
      },
      {
        subjectName: 'Cơ sở dữ liệu',
        topicText: 'Tổng hợp tài liệu',
        semester: '2',
        subjectType: 'QUIZ',
        mode: 'REVIEW',
        sourceType: 'internet',
        schoolName: 'Internet',
        materials: {
          summary: 'Thiết kế và quản lý CSDL.',
          notes: '1. Mô hình quan hệ\n2. SQL\n3. Chuẩn hóa\n4. Thiết kế\n5. Giao dịch',
          tutorials: ['SQL Tutorial - https://www.youtube.com/watch?v=HXV3zeQKqTY'],
          references: ['W3Schools SQL - https://www.w3schools.com/sql/']
        },
        data: { type: 'MATERIALS' }
      }
    ]);

    console.log("✅ Materials seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedMaterials();

