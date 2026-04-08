const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const csvData = `1,CHE 101,Hóa Học Đại Cương,1,LAB
2,CMU-SE 100,Introduction to Software Engineering,3,LEC
3,CS 201,Tin Học Ứng Dụng,2,LEC
4,CS 211,Lập Trình Cơ Sở,3,LEC
5,DTE-IS 102,Hướng Nghiệp 1,1,LEC
6,ES 221,Bóng Đá Sơ Cấp,1,DEM
7,IS-ENG 136,English for International School - Level 1,3,LEC
8,STA 151,Lý Thuyết Xác Suất & Thống Kê Toán,2,LEC
9,CMU-CS 246,Application Development Practices,3,LEC
10,CMU-CS 297,Đồ Án CDIO,1,DIS
11,CMU-CS 311,Object-Oriented Programming C++ (Advanced Concepts in Computing),3,LEC
12,CMU-ENG 130,Anh Văn Chuyên Ngành cho Sinh Viên CMU 1,2,LEC
13,COM 141,Nói & Trình Bày (tiếng Việt),1,LAB
14,IS-ENG 137,English for International School - Level 2,3,LEC
15,IS-ENG 186,English for International School - Level 3,3,LEC
16,MTH 254,Toán Rời Rạc & Ứng Dụng,2,LEC
17,CMU-CS 303,Fundamentals of Computing 1,2,LEC
18,CMU-IS 432,Software Project Management,3,LEC
19,CMU-SE 252,Computer Science for Practicing Engineers (Software Construction),3,LEC
20,COM 142,Viết (tiếng Việt),1,CON
21,IS 301,Cơ Sở Dữ Liệu,3,LEC
22,MTH 291,Toán Ứng Dụng cho Công Nghệ Thông Tin 1,3,LEC
23,PHI 150,Triết Học Marx - Lenin,3,LEC
24,CMU-CS 447,Đồ Án CDIO,1,PRJ
25,CMU-CS 462,Software Measurements & Analysis,3,LEC
26,CMU-ENG 230,Anh Văn Chuyên Ngành cho Sinh Viên CMU 2,2,LEC
27,CMU-SE 214,Requirements Engineering,3,LEC
28,CS 464,Lập Trình Ứng Dụng .NET,2,LEC
29,ES 101,Chạy Ngắn & Bài Thể Dục Tay Không,1,DEM
30,MTH 203,Toán Cao Cấp A3,3,LEC
31,MTH 204,Toán Cao Cấp A3 (LAB),1,LAB
32,MTH 341,Toán Ứng Dụng cho Công Nghệ Thông Tin 2,3,LEC
33,CMU-CS 316,Fundamentals of Computing 2,3,LEC
34,CMU-SE 403,Software Architecture & Design,3,LEC
35,CMU-SE 433,Software Process & Quality Management,3,LEC
36,CMU-SE 450,Capstone Project for Software Engineering 1,3,PRJ
37,ES 276,Cầu Lông Cao Cấp,1,DEM
38,IS 385,Kỹ Thuật Thương Mại Điện Tử,3,LEC
39,IS-ENG 187,English for International School - Level 4,3,LEC
40,IS-ENG 236,English for International School - Level 5,3,LEC
41,ES 100,Giáo Dục Quốc Phòng & An Ninh,3,LEC
42,CMU-IS 401,Information System Applications,3,LEC
43,CMU-SE 303,Software Testing (Verification & Validation),3,LEC
44,CS 466,Perl & Python,2,LEC
45,HIS 221,Lịch Sử Văn Minh Thế Giới 1,2,LEC
46,POS 361,Tư Tưởng Hồ Chí Minh,2,LEC
47,CHE 101,Hóa Học Đại Cương,2,LEC
48,CS 201,Tin Học Ứng Dụng,1,LAB
49,CS 211,Lập Trình Cơ Sở,1,LAB
50,STA 151,Lý Thuyết Xác Suất & Thống Kê Toán,1,REC
51,CMU-CS 311,Object-Oriented Programming C++ (Advanced Concepts in Computing),1,LAB
52,MTH 254,Toán Rời Rạc & Ứng Dụng,1,LAB
53,ES 100,Giáo Dục Quốc Phòng & An Ninh,5,DEM
54,CMU-CS 303,Fundamentals of Computing 1,1,LAB
55,CS 464,Lập Trình Ứng Dụng .NET,1,LAB
56,CMU-SE 403,Software Architecture & Design,1,LAB
57,IS-CS 101,Basic Computer Skills,2,LEC
58,IS-CS 101,Basic Computer Skills,1,LAB
59,IS-DTE 102,Career Orientation,1,LEC
60,IS-ECO 151,Introduction to Microeconomics,3,LEC
61,ES 226,Cầu Lông Sơ Cấp,1,DEM
62,PHI 100,Phương Pháp Luận (gồm Nghiên Cứu Khoa Học),2,LEC
63,CMU-CS 252,Introduction to Network & Telecommunications Technology,3,LEC
64,MTH 103,Toán Cao Cấp A1,2,LEC
65,MTH 103,Toán Cao Cấp A1,1,REC
66,CMU-CS 445,System Integration Practices,3,LEC
67,DTE-IS 152,Hướng Nghiệp 2,1,WOR
68,HIS 362,Lịch Sử Đảng Cộng Sản Việt Nam,2,LEC
69,LAW 201,Pháp Luật Đại Cương,2,LEC
70,POS 151,Kinh Tế Chính Trị Marx - Lenin,2,LEC
71,EVR 205,Sức Khỏe Môi Trường,2,LEC
72,HIS 222,Lịch Sử Văn Minh Thế Giới 2,2,LEC
73,POS 351,Chủ Nghĩa Xã Hội Khoa Học,2,LEC
74,PHY 101,Vật Lý Đại Cương 1,1,LAB
75,PHY 101,Vật Lý Đại Cương 1,2,LEC
76,MTH 104,Toán Cao Cấp A2,1,REC
77,MTH 104,Toán Cao Cấp A2,3,LEC`;

async function main() {
  const lines = csvData.trim().split('\n');
  const courses = lines.map(line => {
    const parts = line.split(',');
    const course_code = parts[1].trim();
    const course_name = parts[2].trim();
    const credits_unit = parseInt(parts[3].trim());
    const study_format = parts[4].trim();
    return {
      course_code,
      course_name,
      credits_unit,
      study_format
    };
  });

  await prisma.course.createMany({
    data: courses,
    skipDuplicates: true,
  });

  console.log('Seeded courses successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });