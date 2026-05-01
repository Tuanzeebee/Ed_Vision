import { useState } from "react";

// Subject data
const subjectData = [
  {
    code: "CS501",
    name: "Nhập môn lập trình",
    semester: "HK 1",
    year: "2024-2025",
    classes: 3,
    students: 120,
  },
  {
    code: "CS502", 
    name: "Cấu trúc dữ liệu",
    semester: "HK 1",
    year: "2024-2025",
    classes: 2,
    students: 85,
  },
  {
    code: "CS503",
    name: "Trí tuệ nhân tạo", 
    semester: "HK 1",
    year: "2024-2025",
    classes: 2,
    students: 75,
  },
  {
    code: "CS504",
    name: "Phát triển ứng dụng web",
    semester: "HK 1", 
    year: "2024-2025",
    classes: 3,
    students: 95,
  },
  {
    code: "CS505",
    name: "Học máy",
    semester: "HK 1",
    year: "2024-2025", 
    classes: 1,
    students: 45,
  }
];

export interface TeacherSubjectsProps {
  teacherId?: string;
}

export default function TeacherSubjects({ teacherId }: TeacherSubjectsProps = {}) {
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [selectedSemester, setSelectedSemester] = useState("Học kỳ 1");

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Năm học</label>
              <select 
                value={selectedYear}
                onChange={(e) =>setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Kỳ học</label>
              <select
                value={selectedSemester}
                onChange={(e) =>setSelectedSemester(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="Học kỳ 1">Học kỳ 1</option>
                <option value="Học kỳ 2">Học kỳ 2</option>
                <option value="Kỳ hè">Kỳ hè</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subject Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Danh sách môn học giảng dạy</h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Mã môn học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên môn học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Học kỳ
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Năm học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Số lớp
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Tổng số SV
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectData.map((subject, index) =>(
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                      {subject.code}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-800">
                      {subject.name}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.semester}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.year}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.classes}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.students}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
}