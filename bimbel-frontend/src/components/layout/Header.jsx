// ============================================
// src/components/layout/Header.jsx
// ============================================
import { Menu as MenuIcon, Bell, LogOut, User } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Logout berhasil');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getRoleName = (role) => {
    const roleNames = {
      'admin_manajemen': 'Admin Manajemen',
      'pembuat_soal': 'Admin Pembuat Soal',
      'siswa': 'Siswa',
    };
    return roleNames[role] || role;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          </button>

          {/* User menu */}
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

            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => navigate('/student/profile')}
                    className={clsx(
                      'flex w-full items-center px-4 py-2 text-sm',
                      active ? 'bg-gray-100' : ''
                    )}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </button>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className={clsx(
                      'flex w-full items-center px-4 py-2 text-sm text-red-600',
                      active ? 'bg-gray-100' : ''
                    )}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
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
