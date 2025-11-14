const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Danh sách tên tiếng Việt ngẫu nhiên
const firstNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Mai', 'Trương', 'Tô'
];

const middleNames = ['Văn', 'Thị', 'Đức', 'Minh', 'Hoàng', 'Quang', 'Thu', 'Hữu', 'Thanh', 'Khánh'];

const lastNames = [
    'An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Giang', 'Hà', 'Hùng', 'Khoa', 'Linh',
    'Long', 'Mai', 'Nam', 'Phương', 'Quân', 'Sơn', 'Tâm', 'Thảo', 'Tuấn', 'Vy',
    'Anh', 'Bảo', 'Chi', 'Duy', 'Hải', 'Hương', 'Lan', 'Minh', 'Ngọc', 'Phúc'
];

function generateVietnameseName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middle = middleNames[Math.floor(Math.random() * middleNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${middle} ${last}`;
}

function generateEmail(studentCode) {
    return `${studentCode.toLowerCase()}@student.cmu.edu.vn`;
}

// Parse CSV line (handle quotes properly)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Calculate final score from components
function calculateFinalScore(scores, weights) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(scores).forEach(component => {
        const score = scores[component];
        const weight = weights[component] || 0;
        if (score !== undefined && !isNaN(score)) {
            totalScore += score * weight / 100;
            totalWeight += weight;
        }
    });

    return totalWeight > 0 ? (totalScore / totalWeight * 100).toFixed(2) : 0;
}

// Convert score to letter grade
function convertToLetterGrade(score) {
    if (score >= 9.0) return 'A+';
    if (score >= 8.5) return 'A';
    if (score >= 8.0) return 'B+';
    if (score >= 7.0) return 'B';
    if (score >= 6.5) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5.0) return 'D+';
    if (score >= 4.0) return 'D';
    return 'F';
}

// Read and parse CSV file
function readCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const headers = parseCSVLine(lines[0]);
    const lastLine = parseCSVLine(lines[lines.length - 1]);

    const weights = {};
    headers.forEach((header, index) => {
        if (index > 1 && lastLine[index]) {
            const weight = lastLine[index].replace('%', '').trim();
            if (weight && !isNaN(weight)) {
                weights[header] = parseFloat(weight);
            }
        }
    });

    const students = [];
    for (let i = 1; i < lines.length - 1; i++) {
        const values = parseCSVLine(lines[i]);
        if (values[1] && values[1].trim()) {
            const student = {
                studentCode: values[1].trim(),
                scores: {}
            };
            headers.forEach((header, index) => {
                if (index > 1 && values[index]) {
                    const score = parseFloat(values[index]);
                    if (!isNaN(score)) {
                        student.scores[header] = score;
                    }
                }
            });
            students.push(student);
        }
    }

    return { headers: headers.slice(2), weights, students };
}

// Import data from Excel files
async function importFromExcel() {
    console.log('🌱 Starting score import from Excel files...\n');

    // Get or create Program and Department first
    let department = await prisma.department.findFirst();
    if (!department) {
        department = await prisma.department.create({
            data: {
                code: 'IT',
                name: 'Khoa Công nghệ thông tin',
                status: 'active'
            }
        });
    }

    let program = await prisma.program.findFirst();
    if (!program) {
        program = await prisma.program.create({
            data: {
                program_code: 'IT2021',
                program_name: 'Công nghệ thông tin',
                department_id: department.department_id,
                duration_years: 4
            }
        });
    }

    // MỖI FILE EXCEL = 1 LỚP RIÊNG BIỆT
    const excelFiles = [
        { file: 'BangDiem_CMU-SE 214 GIS - REQUIREMENTS ENGINEERING.csv', courseCode: 'CMU-SE214', courseName: 'REQUIREMENTS ENGINEERING', classCode: 'CMU-SE214-GIS' },
        { file: 'BangDiem_POS 151 SG - KINH TẾ CHÍNH TRỊ MARX - LENIN.csv', courseCode: 'POS151', courseName: 'KINH TẾ CHÍNH TRỊ MARX - LENIN', classCode: 'POS151-SG' },
        { file: 'BangDiem_LAW 201 SE - PHÁP LUẬT ĐẠI CƯƠNG.csv', courseCode: 'LAW201', courseName: 'PHÁP LUẬT ĐẠI CƯƠNG', classCode: 'LAW201-SE' },
        { file: 'BangDiem_CMU-IS 401 SAIS - INFORMATION SYSTEM APPLICATIONS.csv', courseCode: 'CMU-IS401', courseName: 'INFORMATION SYSTEM APPLICATIONS', classCode: 'CMU-IS401-SAIS' },
        { file: 'BangDiem_MTH 254 XIS1 - TOÁN RỜI RẠC & ỨNG DỤNG.csv', courseCode: 'MTH254-1', courseName: 'TOÁN RỜI RẠC & ỨNG DỤNG', classCode: 'MTH254-1-XIS1' },
        { file: 'BangDiem_MTH 254 XIS - TOÁN RỜI RẠC & ỨNG DỤNG.csv', courseCode: 'MTH254-2', courseName: 'TOÁN RỜI RẠC & ỨNG DỤNG', classCode: 'MTH254-2-XIS' },
        { file: 'BangDiem_MTH 104 Z - TOÁN CAO CẤP A2.csv', courseCode: 'MTH104', courseName: 'TOÁN CAO CẤP A2', classCode: 'MTH104-Z' },
        { file: 'BangDiem_CMU-SE 303 OIS - SOFTWARE TESTING (VERIFICATION & VALIDATION).csv', courseCode: 'CMU-SE303', courseName: 'SOFTWARE TESTING', classCode: 'CMU-SE303-OIS' },
        { file: 'BangDiem_CS 466 G - PERL & PYTHON.csv', courseCode: 'CS466', courseName: 'PERL & PYTHON', classCode: 'CS466-G' }
    ];

    const baseDir = 'C:\\Users\\ASUS\\Downloads\\Tuan_Dep_Trai\\Tuan_Dep_Trai';

    let totalStudents = 0;
    let totalRecords = 0;
    let totalClasses = 0;

    for (const { file, courseCode, courseName, classCode } of excelFiles) {
        const filePath = path.join(baseDir, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${file} (not found)`);
            continue;
        }

        console.log(`📚 Processing: ${courseName} (${courseCode}) - Class: ${classCode}`);

        // Tạo ClassGroup riêng cho mỗi file Excel
        let classGroup = await prisma.classGroup.findFirst({
            where: { class_code: classCode }
        });

        if (!classGroup) {
            classGroup = await prisma.classGroup.create({
                data: {
                    class_code: classCode,
                    program_id: program.program_id,
                    cohort_year: 2024,
                    status: 'active'
                }
            });
            totalClasses++;
            console.log(`   ✅ Created class: ${classCode}`);
        }

        const { weights, students } = readCSV(filePath);

        // Random academic year and semester (2022-2025)
        const years = ['2022-2023', '2023-2024', '2024-2025'];
        const academicYear = years[Math.floor(Math.random() * years.length)];
        const semesterNumber = Math.floor(Math.random() * 2) + 1;

        // Get or create academic term
        let term = await prisma.academicTerm.findFirst({
            where: {
                academic_year: academicYear,
                semester_number: semesterNumber
            }
        });

        if (!term) {
            term = await prisma.academicTerm.create({
                data: {
                    academic_year: academicYear,
                    semester_number: semesterNumber,
                    status: 'active'
                }
            });
        }

        // Get or create course
        let course = await prisma.course.findFirst({
            where: { course_code: courseCode }
        });

        if (!course) {
            course = await prisma.course.create({
                data: {
                    course_code: courseCode,
                    course_name: courseName,
                    credits_unit: 3
                }
            });
        }

        let studentCount = 0;
        let recordCount = 0;

        for (const studentData of students) {
            // Get or create student
            let student = await prisma.student.findFirst({
                where: { student_code: studentData.studentCode }
            });

            if (!student) {
                const account = await prisma.account.create({
                    data: {
                        email: generateEmail(studentData.studentCode),
                        password_hash: '$2b$10$XrKZqDPPg9v8bXJZ8K5L0.hO9PZvYxYzYzYzYzYzYzYzYzYzYzYzY',
                        role_id: 4
                    }
                });

                await prisma.profile.create({
                    data: {
                        account_id: account.account_id,
                        full_name: generateVietnameseName(),
                        gender: Math.random() > 0.5 ? 'Male' : 'Female'
                    }
                });

                student = await prisma.student.create({
                    data: {
                        account_id: account.account_id,
                        student_code: studentData.studentCode,
                        major: 'Công nghệ thông tin',
                        cohort_year: parseInt(studentData.studentCode.substring(0, 2)) + 2000,
                        class_id: classGroup.class_id,
                        status: 'active'
                    }
                });
                studentCount++;
            }

            // Calculate final score
            const rawScore = parseFloat(calculateFinalScore(studentData.scores, weights));
            const letterGrade = convertToLetterGrade(rawScore);

            // Create or update StudentCourseRecord
            const existingRecord = await prisma.studentCourseRecord.findFirst({
                where: {
                    student_id: student.student_id,
                    course_id: course.course_id
                }
            });

            if (existingRecord) {
                await prisma.studentCourseRecord.update({
                    where: { record_id: existingRecord.record_id },
                    data: {
                        term_id: term.term_id,
                        raw_score: rawScore,
                        converted_score: letterGrade,
                        converted_numeric_score: rawScore,
                        status: 'completed'
                    }
                });
            } else {
                await prisma.studentCourseRecord.create({
                    data: {
                        student_id: student.student_id,
                        course_id: course.course_id,
                        term_id: term.term_id,
                        raw_score: rawScore,
                        converted_score: letterGrade,
                        converted_numeric_score: rawScore,
                        status: 'completed'
                    }
                });
                recordCount++;
            }
        }

        console.log(`   ✅ ${studentCount} new students, ${recordCount} records`);
        console.log(`   📅 ${academicYear} - HK${semesterNumber}\n`);

        totalStudents += studentCount;
        totalRecords += recordCount;
    }

    console.log('📊 Summary:');
    console.log(`   ✅ Total classes created: ${totalClasses}`);
    console.log(`   ✅ Total new students: ${totalStudents}`);
    console.log(`   ✅ Total course records: ${totalRecords}`);
    console.log('\n✅ Score import completed!');
}

async function main() {
    try {
        await importFromExcel();
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
