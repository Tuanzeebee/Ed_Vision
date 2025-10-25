import { Search, ChevronDown } from 'lucide-react';

// Asset imports - Update these paths to match your actual assets
import imgLogo from "@/assets/teacher/9ba9709b329a1fc3361b3b789060fd60189be79f.png"
import imgAvatar from "@/assets/teacher/1162b70d9bce3d9bc46857cc86bb8bdc5c5e3d08.png"

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <img src={imgLogo} alt="Logo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-xl font-bold text-gray-800">Giảng viên Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Tìm kiếm sinh viên..."
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
            <img src={imgAvatar} alt="Avatar" className="w-8 h-8 rounded-full" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">TS. Nguyễn Văn A</span>
              <span className="text-xs text-gray-500">Giảng viên</span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
