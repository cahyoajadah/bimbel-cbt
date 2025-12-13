import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Book, BookCopy, BookOpen, Calendar, Users, 
  MessageSquare, FileText, ClipboardList, Video, GraduationCap,
  Clock, TrendingUp, X, Activity, Megaphone, Trophy, // [FIX] Import Trophy Component
  Image as ImageIcon 
} from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore'; 
import logoImage from '../../assets/logo2.png'; 

const menuItems = {
  // Key role: 'admin_manajemen'
  'admin_manajemen': [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/programs-manage', icon: BookCopy, label: 'Program' },
    { path: '/admin/subjects', icon: Book, label: 'Mata Pelajaran' },
    { path: '/admin/materials', icon: BookOpen, label: 'Materi' },
    { path: '/admin/schedules', icon: Calendar, label: 'Jadwal' },
    { path: '/admin/announcements', icon: Megaphone, label: "Pengumuman" },
    { path: '/admin/teachers', icon: GraduationCap, label: 'Pembimbing' },
    { path: '/admin/students', icon: Users, label: 'Siswa' },
    { path: '/admin/monitoring', icon: Activity, label: 'Monitoring' },
    { path: '/admin/content-manager', icon: ImageIcon, label: 'Manajemen Konten' },
  ],
  
  // Key role: 'pembuat_soal'
  'pembuat_soal': [
    { path: '/question-maker/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/question-maker/packages', icon: Package, label: 'Paket Soal' },
    { path: '/question-maker/reports', icon: ClipboardList, label: 'Pengaduan Soal' },
  ],
  
  // Key role: 'siswa'
  'siswa': [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/subjects', icon: BookOpen, label: 'Mata Pelajaran' },
    { path: '/student/classes', icon: Video, label: 'Kelas Live' },
    { path: '/student/tryouts', icon: FileText, label: 'Tryout dan Latihan Soal' },
    
    // [BARU] Menu Perangkingan (Pastikan icon tidak dipetik '...')
    { path: '/student/rankings', icon: Trophy, label: 'Perangkingan' },

    { path: '/student/schedules', icon: Clock, label: 'Jadwal Bimbel' },
    { path: '/student/progress', icon: TrendingUp, label: 'Progres Belajar' },
    { path: '/student/feedbacks', icon: MessageSquare, label: 'Feedback' },
    { path: '/student/profile', icon: Users, label: 'Profil' }, 
  ],
};

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore(); 
  
  // Tentukan items berdasarkan role user yang sedang login
  const items = (user?.role && menuItems[user.role]) ? menuItems[user.role] : [];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo Area */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2">
                <img 
                    src={logoImage} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain" 
                />
            </Link>

            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {items.length > 0 ? (
                items.map((item) => {
                  const Icon = item.icon;
                  // Logic active state
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-blue-700' : 'text-gray-400')} />
                      {item.label}
                    </Link>
                  );
                })
            ) : (
                <div className="p-4 text-sm text-gray-400 text-center">
                    Memuat menu...
                </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};