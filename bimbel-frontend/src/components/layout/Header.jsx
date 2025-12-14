import { Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { authService } from '../../api/services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Menu, Popover, Transition } from '@headlessui/react';
import { 
  Menu as MenuIcon, 
  Bell, 
  LogOut, 
  User, 
  ChevronDown, 
  FileWarning, 
  ChevronRight 
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Optional jika ingin invalidate query saat logout

  // --- LOGIKA NOTIFIKASI (TETAP SAMA) ---
  const { data: studentNotifs } = useQuery({
    queryKey: ['unread-announcements'],
    queryFn: async () => (await api.get(API_ENDPOINTS.STUDENT_ANNOUNCEMENTS_RECENT)).data.data,
    enabled: user?.role === 'siswa',
    refetchInterval: 30000,
  });

  const { data: makerNotifs } = useQuery({
    queryKey: ['pending-reports'],
    queryFn: async () => {
        const res = await api.get('/question-maker/reports?status=pending');
        return res.data.data.data || []; 
    },
    enabled: user?.role === 'pembuat_soal',
    refetchInterval: 60000,
  });

  const notifications = user?.role === 'siswa' ? studentNotifs : makerNotifs;
  const notifTitle = user?.role === 'siswa' ? 'Pengumuman Belum Dibaca' : 'Laporan Soal Baru';
  const showBell = user?.role === 'siswa' || user?.role === 'pembuat_soal';

  const handleViewAllNotifs = (close) => {
      close();
      if (user?.role === 'siswa') navigate('/student/announcements');
      else if (user?.role === 'pembuat_soal') navigate('/question-maker/reports');
  };
  // ------------------------------------

  // --- LOGIKA AUTH & ROLE ---
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Logout berhasil');
    },
    onError: () => {
       // Fallback logout client-side jika server error
       logout();
       navigate('/login');
    }
  });

  const handleLogout = () => logoutMutation.mutate();

  const getRoleName = (role) => {
    const roleNames = {
      'admin_manajemen': 'Admin Manajemen',
      'pembuat_soal': 'Pembuat Soal',
      'siswa': 'Siswa',
    };
    return roleNames[role] || role;
  };

  // Helper untuk menentukan path profil yang dinamis
  const getProfilePath = () => {
    if (user?.role === 'admin_manajemen') return '/admin/profile';
    if (user?.role === 'pembuat_soal') return '/question-maker/profile';
    if (user?.role === 'siswa') return '/student/profile';
    return '/profile';
  };
  // --------------------------

  return (
    <header className={clsx(
      "sticky z-30 transition-all duration-300",
      // Mobile view
      "top-0 border-b border-gray-100 bg-white/95 backdrop-blur-sm",
      // Desktop view (Floating style)
      "lg:top-4 lg:mx-8 lg:rounded-2xl lg:border-0 lg:bg-white/80 lg:backdrop-blur-xl lg:shadow-lg lg:shadow-blue-900/5"
    )}>
      <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Sidebar Toggle (Mobile) */}
        <div className="flex items-center flex-1 gap-4">
          <button 
            onClick={toggleSidebar} 
            className="text-gray-500 hover:text-blue-700 focus:outline-none lg:hidden p-2 rounded-xl hover:bg-blue-50 transition-colors -ml-2"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center gap-3 sm:gap-6">
          
          {/* --- NOTIFIKASI POP OVER (TETAP SAMA) --- */}
          {showBell && (
            <Popover className="relative">
              {({ open, close }) => (
                <>
                  <Popover.Button className={clsx("relative p-3 rounded-xl transition-all duration-200 focus:outline-none group overflow-hidden", open ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50 hover:text-blue-600")}>
                    <span className="absolute inset-0 bg-blue-200 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></span>
                    <Bell className={clsx("w-6 h-6 relative z-10 transition-transform group-hover:rotate-12", open && "fill-blue-700/20")} />
                    {notifications?.length > 0 && <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-bounce" />}
                  </Popover.Button>

                  <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-4 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-4 scale-95">
                    <Popover.Panel className="absolute right-0 z-50 mt-4 w-80 sm:w-96 transform px-4 sm:px-0 origin-top-right">
                      <div className="overflow-hidden rounded-3xl shadow-2xl shadow-blue-900/20 ring-1 ring-black ring-opacity-5 bg-white border border-gray-50">
                        <div className="p-0">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <h3 className="text-base font-bold text-gray-800">{notifTitle}</h3>
                                {notifications?.length > 0 && <span className="text-[11px] bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold shadow-sm">{notifications.length} Baru</span>}
                            </div>
                            
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-gray-50/30">
                                {notifications && notifications.length > 0 ? (
                                    notifications.map((item) => (
                                        <div key={item.id} onClick={() => handleViewAllNotifs(close)} className="group relative flex flex-col gap-1 px-6 py-4 hover:bg-white transition-all cursor-pointer border-b border-gray-100 last:border-0 hover:shadow-sm">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            {user.role === 'siswa' ? (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{item.title}</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2 ml-5 leading-relaxed mt-1">{item.content}</p>
                                                    <span className="text-[11px] text-gray-400 ml-5 mt-2 block font-medium">{new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                                        <FileWarning size={16} className="fill-red-50" /> Laporan #{item.id}
                                                    </h4>
                                                    <p className="text-sm text-gray-800 font-medium line-clamp-1 mt-1">"{item.question?.question_text || 'Soal dihapus'}"</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <User size={12} className="text-gray-400"/>
                                                        <p className="text-xs text-gray-500">Oleh: <span className="font-medium text-gray-700">{item.student?.user?.name}</span></p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <div className="p-4 bg-gray-100 rounded-full"><Bell size={32} className="opacity-40 text-gray-500"/></div>
                                        <p className="text-sm font-medium">Tidak ada notifikasi baru.</p>
                                    </div>
                                }
                            </div>
                            
                            <div className="p-4 bg-white border-t border-gray-50/50">
                                <button className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] transition-all active:scale-[0.98]" onClick={() => handleViewAllNotifs(close)}>
                                    Lihat Selengkapnya <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          )}

          {/* --- USER MENU DROPDOWN --- */}
          <Menu as="div" className="relative">
            <Menu.Button className="group flex items-center gap-3 focus:outline-none p-1.5 pr-4 rounded-full transition-all border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white group-hover:scale-105 transition-transform duration-300">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors leading-tight">{user?.name}</p>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{getRoleName(user?.role)}</p>
              </div>
              <ChevronDown size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors hidden md:block" />
            </Menu.Button>

            <Transition as={Fragment} enter="transition ease-out duration-150" enterFrom="transform opacity-0 scale-95 translate-y-2" enterTo="transform opacity-100 scale-100 translate-y-0" leave="transition ease-in duration-100" leaveFrom="transform opacity-100 scale-100 translate-y-0" leaveTo="transform opacity-0 scale-95 translate-y-2">
              <Menu.Items className="absolute right-0 mt-3 w-64 origin-top-right rounded-3xl bg-white p-2 shadow-2xl shadow-blue-900/20 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-50/50 divide-y divide-gray-100/50">
                
                {/* Info User di Mobile (karena nama user disembunyikan di tombol utama) */}
                <div className="px-4 py-3 md:hidden bg-gray-50/50 rounded-t-2xl mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate font-medium">{user?.email}</p>
                </div>

                {/* --- MENU PROFIL (DIBUAT DINAMIS & TERSEDIA UNTUK SEMUA ROLE) --- */}
                <div className="py-1.5">
                    <Menu.Item>
                        {({ active }) => (
                            <Link
                            to={getProfilePath()} // Link dinamis berdasarkan role
                            className={clsx(
                                'flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors group', 
                                active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            )}
                            >
                            <User className={clsx("w-5 h-5 mr-3 transition-colors", active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} /> 
                            Profil Saya
                            </Link>
                        )}
                    </Menu.Item>
                </div>
                
                {/* --- MENU LOGOUT --- */}
                <div className="py-1.5">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className={clsx(
                            'flex w-full items-center px-4 py-3 text-sm font-bold rounded-xl transition-colors group', 
                            active ? 'bg-red-50 text-red-600' : 'text-red-600 hover:bg-red-50/50'
                        )}
                      >
                        <LogOut className={clsx("w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1", active ? "text-red-600" : "text-red-500")} /> 
                        {logoutMutation.isPending ? 'Keluar...' : 'Keluar Aplikasi'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};