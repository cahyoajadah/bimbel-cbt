import { Menu as MenuIcon, Bell, LogOut, User, ChevronRight, FileWarning } from 'lucide-react';
import { Menu, Popover, Transition } from '@headlessui/react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Fragment } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  // LOGIKA NOTIFIKASI DINAMIS
  // 1. SISWA -> Fetch Announcements
  const { data: studentNotifs } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: async () => (await api.get(API_ENDPOINTS.STUDENT_ANNOUNCEMENTS_RECENT)).data.data,
    enabled: user?.role === 'siswa',
  });

  // 2. PEMBUAT SOAL -> Fetch Pending Reports
  const { data: makerNotifs } = useQuery({
    queryKey: ['pending-reports'],
    queryFn: async () => (await api.get('/question-maker/reports?status=pending')).data.data,
    enabled: user?.role === 'pembuat_soal', // Ganti role sesuai DB Anda (misal: 'question_maker')
  });

  // Tentukan data notif yang dipakai
  const notifications = user?.role === 'siswa' ? studentNotifs : makerNotifs;
  const notifTitle = user?.role === 'siswa' ? 'Pengumuman Terbaru' : 'Laporan Soal Baru';
  const showBell = user?.role === 'siswa' || user?.role === 'pembuat_soal' || user?.role === 'question_maker';

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Logout berhasil');
    },
  });

  const handleLogout = () => logoutMutation.mutate();

  const getRoleName = (role) => {
    const roleNames = {
      'admin_manajemen': 'Admin Manajemen',
      'pembuat_soal': 'Pembuat Soal',
      'question_maker': 'Pembuat Soal',
      'siswa': 'Siswa',
    };
    return roleNames[role] || role;
  };

  const handleViewAll = () => {
      if (user?.role === 'siswa') navigate('/student/announcements');
      else navigate('/question-maker/reports');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          
          {/* --- NOTIFIKASI DINAMIS --- */}
          {showBell && (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className={clsx("relative p-2 rounded-full hover:bg-gray-100 focus:outline-none", open && "bg-gray-100")}>
                    <Bell className={clsx("w-6 h-6", open ? "text-blue-600" : "text-gray-400")} />
                    {notifications?.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 transform px-4 sm:px-0">
                      <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-3 border-b pb-2">
                                <h3 className="text-sm font-bold text-gray-900">{notifTitle}</h3>
                                <button onClick={handleViewAll} className="text-xs text-blue-600 hover:underline">Lihat Semua</button>
                            </div>
                            
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {notifications && notifications.length > 0 ? (
                                    notifications.map((item) => (
                                        <div key={item.id} className="group relative flex flex-col gap-1 p-2 hover:bg-gray-50 rounded-md transition-colors cursor-default border-b border-gray-50 last:border-0">
                                            {/* LOGIKA TAMPILAN ITEM (SISWA vs MAKER) */}
                                            {user.role === 'siswa' ? (
                                                <>
                                                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                                                    <span className="text-[10px] text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                                        <FileWarning size={14} /> Laporan #{item.id}
                                                    </h4>
                                                    <p className="text-xs text-gray-800 font-medium line-clamp-1">"{item.question?.question_text || 'Soal dihapus'}"</p>
                                                    <p className="text-xs text-gray-500 line-clamp-1">Oleh: {item.student?.user?.name}</p>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : <p className="text-sm text-gray-500 text-center py-4">Tidak ada notifikasi baru.</p>}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <button 
                                  className="flex w-full items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  onClick={handleViewAll}
                                >
                                    Lihat Selengkapnya <ChevronRight size={14} className="ml-1" />
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
          {/* Jika Admin, tidak ada lonceng render sama sekali */}


          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 focus:outline-none">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{getRoleName(user?.role)}</p>
                </div>
              </div>
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => navigate(user?.role === 'siswa' ? '/student/profile' : '#')}
                    className={clsx('flex w-full items-center px-4 py-2 text-sm', active ? 'bg-gray-100' : '')}
                  >
                    <User className="w-4 h-4 mr-2" /> Profil
                  </button>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className={clsx('flex w-full items-center px-4 py-2 text-sm text-red-600', active ? 'bg-gray-100' : '')}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </header>
  );
};