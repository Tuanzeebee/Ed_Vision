import { Menu, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Input } from '@/components/ui/teacher/teacher_input';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?w=40&h=40&fit=crop&crop=center"
            alt="Logo"
            className="w-8 h-8 md:w-10 md:h-10 rounded"
          />
          <h1 className="text-lg md:text-xl font-bold text-blue-900">
            Giảng viên Dashboard
          </h1>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="hidden md:block relative">
            <Input
              type="text"
              placeholder="Tìm lớp học, sinh viên..."
              className="w-64 pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          <div className="relative">
            <Button variant="ghost" className="flex items-center space-x-2">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                alt="Avatar"
                className="w-8 h-8 md:w-10 md:h-10 rounded-full"
              />
              <span className="hidden md:block font-medium">TS. Nguyễn Văn A</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
