import AdminLayout from "../../components/ui/admin/AdminLayout";

// Import image assets
import imgAdmin from "../../assets/parent/c47870bf01f989650eaadfebe75f1949340dd812.png"
import imgUser1 from "../../assets/parent/1162b70d9bce3d9bc46857cc86bb8bdc5c5e3d08.png"
import imgUser2 from "../../assets/parent/7c6922ae3190c8299bc180b4dcf8ebdbb7375921.png"
import imgUser3 from "../../assets/parent/80590115117c5f72e317a9fc5e7105049fb7d1da.png"
import imgUser4 from "../../assets/parent/68ac1bee97c99b0898da5250c533dbe2f4b998dd.png"
import imgUser5 from "../../assets/parent/e978b833672fc70116d1ad26305f7e7a10a729fd.png"

// Icon components
const SearchIcon = () => <i className="fas fa-search text-gray-400"></i>;
const PlusIcon = () => <i className="fas fa-plus text-white"></i>;
const EyeIcon = () => <i className="fas fa-eye text-blue-600"></i>;
const EditIcon = () => <i className="fas fa-edit text-green-600"></i>;
const LockIcon = () => <i className="fas fa-lock text-red-600"></i>;
const UnlockIcon = () => <i className="fas fa-unlock text-green-600"></i>;
const DeleteIcon = () => <i className="fas fa-trash text-red-600"></i>;
const ChevronLeftIcon = () => <i className="fas fa-chevron-left text-gray-500"></i>;
const ChevronRightIcon = () => <i className="fas fa-chevron-right text-gray-400"></i>;

// Status badge component
const StatusBadge = ({ status, children }: { status: 'active' | 'inactive' | 'blocked'; children: React.ReactNode }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";
  const statusClasses = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-yellow-100 text-yellow-800", 
    blocked: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`${baseClasses} ${statusClasses[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-green-500' : 
        status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></span>
      {children}
    </span>
  );
};

// Role badge component  
const RoleBadge = ({ role }: { role: string }) => {
  const roleColors = {
    'Quản trị viên': 'bg-blue-100 text-blue-800',
    'Giảng viên': 'bg-purple-100 text-purple-800',
    'Sinh viên': 'bg-orange-100 text-orange-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
};

// Simple Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = "primary", size = "md", className = "", ...props }: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
    ghost: "hover:bg-gray-100 text-gray-600"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2 text-sm", 
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function AccountManagement() {
  const userData = [
    {
      id: "#001",
      avatar: imgUser1,
      name: "Nguyễn Văn An",
      birth: "15/03/1995",
      gender: "Nam",
      email: "nguyen.van.an@predica.edu.vn",
      school: "Khoa học Máy tính",
      role: "Quản trị viên",
      joinDate: "01/09/2020",
      status: "active" as const
    },
    {
      id: "#002", 
      avatar: null,
      name: "Trần Thị Bình",
      birth: "22/07/1992",
      gender: "Nữ",
      email: "tran.thi.binh@predica.edu.vn", 
      school: "Y - Dược",
      role: "Giảng viên",
      joinDate: "15/02/2019",
      status: "inactive" as const
    },
    {
      id: "#003",
      avatar: imgUser2,
      name: "Lê Văn Cường", 
      birth: "10/11/1988",
      gender: "Nam",
      email: "le.van.cuong@predica.edu.vn",
      school: "Kinh Tế",
      role: "Sinh viên",
      joinDate: "10/08/2021",
      status: "blocked" as const
    },
    {
      id: "#004",
      avatar: imgUser3,
      name: "Phạm Thị Dung",
      birth: "05/12/1990", 
      gender: "Nữ",
      email: "pham.thi.dung@predica.edu.vn",
      school: "Công Nghệ",
      role: "Giảng viên",
      joinDate: "20/03/2018",
      status: "active" as const
    },
    {
      id: "#005",
      avatar: imgAdmin,
      name: "Hoàng Văn Em",
      birth: "18/09/1993",
      gender: "Nam", 
      email: "hoang.van.em@predica.edu.vn",
      school: "Du lịch",
      role: "Sinh viên",
      joinDate: "12/09/2022",
      status: "inactive" as const
    },
    {
      id: "#006",
      avatar: imgUser4,
      name: "Vũ Thị Giang",
      birth: "28/04/1991",
      gender: "Nữ",
      email: "vu.thi.giang@predica.edu.vn", 
      school: "Đào tạo quốc tế",
      role: "Quản trị viên",
      joinDate: "05/01/2017",
      status: "active" as const
    },
    {
      id: "#007",
      avatar: imgUser1,
      name: "Đặng Văn Hùng",
      birth: "14/06/1989",
      gender: "Nam",
      email: "dang.van.hung@predica.edu.vn",
      school: "Xã hội", 
      role: "Giảng viên",
      joinDate: "25/11/2016",
      status: "blocked" as const
    },
    {
      id: "#008",
      avatar: imgUser5,
      name: "Ngô Thị Lan",
      birth: "03/02/1994",
      gender: "Nữ",
      email: "ngo.thi.lan@predica.edu.vn",
      school: "Y - Dược",
      role: "Sinh viên",
      joinDate: "08/07/2023", 
      status: "active" as const
    }
  ];

  return (
    <AdminLayout 
      activePage="/admin/users"
    >
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Tài khoản & Vai trò</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng trong hệ thống</p>
        </div>

        {/* Controls Section */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search and Add Button */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input 
                  type="text"
                  placeholder="Tìm kiếm tài khoản..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button className="cursor-pointer px-3 py-2">
                <PlusIcon />
                <span className="ml-2">Thêm mới</span>
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm w-32 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="text-gray-700">Tất cả vai trò</option>
                <option value="admin" className="text-gray-700">Quản trị viên</option>
                <option value="teacher" className="text-gray-700">Giảng viên</option>
                <option value="student" className="text-gray-700">Sinh viên</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm w-32 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="text-gray-700">Tất cả trạng thái</option>
                <option value="active" className="text-gray-700">Hoạt động</option>
                <option value="inactive" className="text-gray-700">Vắng mặt</option>
                <option value="blocked" className="text-gray-700">Đã khóa</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm w-36 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="text-gray-700">Tất cả trường</option>
                <option value="cs" className="text-gray-700">Khoa học Máy tính</option>
                <option value="medical" className="text-gray-700">Y - Dược</option>
                <option value="economics" className="text-gray-700">Kinh Tế</option>
                <option value="technology" className="text-gray-700">Công Nghệ</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700">
              <div className="col-span-1">Mã số</div>
              <div className="col-span-2">Họ và tên</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-1">Trường</div>
              <div className="col-span-1">Vai trò</div>
              <div className="col-span-1">Ngày đăng ký</div>
              <div className="col-span-1">Trạng thái</div>
              <div className="col-span-2 text-center">Thao tác</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {userData.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-800">{user.id}</span>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center">
                        <i className="fas fa-user text-gray-400"></i>
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.birth} • {user.gender}</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-600">{user.school}</span>
                </div>
                
                <div className="col-span-1 flex items-center">
                  <RoleBadge role={user.role} />
                </div>
                
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-600">{user.joinDate}</span>
                </div>
                
                <div className="col-span-1 flex items-center">
                  <StatusBadge status={user.status}>
                    {user.status === 'active' ? 'Hoạt động' : 
                     user.status === 'inactive' ? 'Vắng mặt' : 'Đã khóa'}
                  </StatusBadge>
                </div>
                
                <div className="col-span-2 flex items-center justify-center space-x-1">
                  <Button variant="ghost" size="sm" title="Xem chi tiết" className="hover:bg-blue-50">
                    <EyeIcon />
                  </Button>
                  <Button variant="ghost" size="sm" title="Chỉnh sửa" className="hover:bg-green-50">
                    <EditIcon />
                  </Button>
                  {user.status === 'blocked' ? (
                    <Button variant="ghost" size="sm" title="Mở khóa" className="hover:bg-green-50">
                      <UnlockIcon />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" title="Khóa tài khoản" className="hover:bg-red-50">
                      <LockIcon />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title="Xóa" className="hover:bg-red-50">
                    <DeleteIcon />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị 1 đến 8 của 247 kết quả
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" disabled className="opacity-50">
                  <ChevronLeftIcon />
                  <span className="ml-1">Trước</span>
                </Button>
                <Button size="sm" className="bg-blue-600 text-white">1</Button>
                <Button variant="secondary" size="sm">2</Button>
                <Button variant="secondary" size="sm">3</Button>
                <span className="px-2 text-gray-500">...</span>
                <Button variant="secondary" size="sm">31</Button>
                <Button variant="secondary" size="sm">
                  <span className="mr-1">Sau</span>
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}