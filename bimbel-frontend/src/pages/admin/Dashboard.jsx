// src/pages/admin/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, Package, GraduationCap, TrendingUp } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import clsx from 'clsx';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
  });

  const stats = data?.data || {};

  const statsCards = [
    {
      title: 'Total Siswa',
      value: stats.total_siswa || 0,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Pembimbing',
      value: stats.total_pembimbing || 0,
      icon: GraduationCap,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Paket Tryout',
      value: stats.total_paket_tryout || 0,
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Materi',
      value: stats.total_materi || 0,
      icon: BookOpen,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner text="Memuat dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang di panel administrasi National Academy Taruna Bangsa.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', stat.bgColor)}>
                  <Icon className={clsx('w-6 h-6', stat.textColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/students"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola Siswa</h3>
            <p className="text-sm text-gray-600 mt-1">Tambah, edit, atau hapus data siswa</p>
          </a>

          <a
            href="/admin/packages"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Package className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola Paket</h3>
            <p className="text-sm text-gray-600 mt-1">Atur paket tryout dan pembelajaran</p>
          </a>

          <a
            href="/admin/schedules"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola Jadwal</h3>
            <p className="text-sm text-gray-600 mt-1">Buat jadwal kelas dan tryout</p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sistem berjalan normal</p>
              <p className="text-xs text-gray-500">Semua service aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}