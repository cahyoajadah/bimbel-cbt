import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Book, BookCopy, BookOpen, Calendar, Users, 
  MessageSquare, FileText, ClipboardList, Video, GraduationCap,
  Clock, TrendingUp, X, Activity, Megaphone, Trophy,
  Image as ImageIcon // [FIX] Import ikon Image dikembalikan
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
    // [FIX] Menu ini dikembalikan
    { path: '/admin/content-manager', icon: ImageIcon, label: 'Manajemen Konten' },
    { path: '/admin/profile', icon: Users, label: 'Profil' },
  ],
  
  // Key role: 'pembuat_soal'
  'pembuat_soal': [
    { path: '/question-maker/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/question-maker/packages', icon: Package, label: 'Paket Soal' },
    { path: '/question-maker/reports', icon: ClipboardList, label: 'Pengaduan Soal' },
    { path: '/question-maker/profile', icon: Users, label: 'Profil' },
  ],
  
  // Key role: 'siswa'
  'siswa': [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/subjects', icon: BookOpen, label: 'Mata Pelajaran' },
    { path: '/student/classes', icon: Video, label: 'Kelas Live' },
    { path: '/student/tryouts', icon: FileText, label: 'Tryout dan Latihan Soal' },
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
  
  const items = (user?.role && menuItems[user.role]) ? menuItems[user.role] : [];

  return (
    <>
      {/* Mobile overlay - backdrop blur */}
      <div
        className={clsx(
          "fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar - Floating Style */}
      <aside
        className={clsx(
          'fixed z-40 w-64 bg-white transform transition-all duration-300 ease-in-out flex flex-col',
          // Style "Floating" modern
          'top-0 lg:top-4 left-0 lg:left-4 bottom-0 lg:bottom-4 h-screen lg:h-[calc(100vh-2rem)]',
          'rounded-none lg:rounded-2xl',
          'shadow-xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
          // Translasi untuk buka tutup
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
          {/* Logo Area */}
          <div className="flex items-center justify-between h-20 px-6 shrink-0 relative">
             {/* Hiasan background header sidebar */}
             <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-50 rounded-t-2xl -z-10"></div>

            <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                   <div className="absolute -inset-2 bg-blue-200 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500"></div>
                   <img 
                       src={logoImage} 
                       alt="Logo" 
                       className="h-10 w-auto relative z-10 drop-shadow-sm transition-transform group-hover:scale-105" 
                   />
                </div>
            </Link>

            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {items.length > 0 ? (
                items.map((item) => {
                  const Icon = item.icon;
                  // Check if current path matches item path or is a sub-path
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 translate-x-1' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm hover:translate-x-1' 
                      )}
                    >
                      {/* Efek gelombang saat hover pada menu inaktif */}
                      {!isActive && <span className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></span>}

                      <Icon 
                        className={clsx(
                          'w-[1.35rem] h-[1.35rem] mr-3 transition-transform duration-300 group-hover:scale-110', 
                          isActive ? 'text-blue-100' : 'text-gray-400 group-hover:text-blue-600'
                        )} 
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="relative z-10 tracking-wide">{item.label}</span>
                    </Link>
                  );
                })
            ) : (
                <div className="p-4 text-sm text-gray-500 text-center animate-pulse flex flex-col items-center">
                   <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                   Memuat menu...
                </div>
            )}
          </nav>

          {/* User Info Footer */}
          <div className="p-4 m-4 bg-blue-50/80 rounded-2xl border border-blue-100/50 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                   <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
                </div>
             </div>
          </div>
      </aside>
    </>
  );
};