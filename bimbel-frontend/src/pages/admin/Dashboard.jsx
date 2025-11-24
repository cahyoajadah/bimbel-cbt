import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, GraduationCap, Book, BookOpen, Calendar, 
  Activity, ArrowRight, Layout
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => (await api.get('/admin/dashboard')).data,
  });

  const stats = statsData?.data || {};

  const statCards = [
    { 
      label: 'Total Siswa', 
      value: stats.total_students || 0, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    { 
      label: 'Total Pembimbing', 
      value: stats.total_teachers || 0, 
      icon: GraduationCap, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    { 
      label: 'Mata Pelajaran', 
      value: stats.total_subjects || 0, 
      icon: Book, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      border: 'border-violet-100'
    },
    { 
      label: 'Jadwal Aktif', 
      value: stats.total_schedules || 0, 
      icon: Calendar, 
      color: 'text-pink-600', 
      bg: 'bg-pink-50',
      border: 'border-pink-100'
    },
  ];

  const quickActions = [
    {
      title: 'Manajemen Siswa',
      desc: 'Kelola data siswa, aktivasi akun, dan pembagian kelas.',
      icon: Users,
      path: '/admin/students',
      color: 'blue'
    },
    {
      title: 'Atur Jadwal',
      desc: 'Buat dan atur jadwal bimbingan belajar mingguan.',
      icon: Calendar,
      path: '/admin/schedules',
      color: 'pink'
    },
    {
      title: 'Monitoring & Evaluasi',
      desc: 'Pantau nilai tryout dan berikan feedback bulanan.',
      icon: Activity,
      path: '/admin/monitoring', // [UBAH] Path diperbarui
      color: 'orange'
    },
    {
      title: 'Manajemen Guru',
      desc: 'Kelola data pengajar dan penugasan mata pelajaran.',
      icon: GraduationCap,
      path: '/admin/teachers',
      color: 'emerald'
    },
    {
      title: 'Bank Materi',
      desc: 'Upload dan kelola materi pembelajaran digital.',
      icon: BookOpen,
      path: '/admin/materials',
      color: 'amber'
    },
    {
      title: 'Mata Pelajaran',
      desc: 'Atur daftar mata pelajaran yang tersedia.',
      icon: Layout,
      path: '/admin/subjects',
      color: 'violet'
    }
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan data akademik dan pusat kontrol manajemen.
          </p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
           {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`bg-white p-5 rounded-xl shadow-sm border ${card.border} transition-all duration-200 hover:shadow-md`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              </div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-gray-500" />
            Menu Manajemen Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
                const Icon = action.icon;
                const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
                    pink: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100',
                    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
                    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
                    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
                    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
                };

                return (
                    <Link 
                        key={index} 
                        to={action.path}
                        // [FIX] Layout: justify-between agar panah di ujung kanan
                        className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between gap-4"
                    >
                        {/* Wrapper Konten Kiri (Icon + Teks) */}
                        <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg transition-colors shrink-0 ${colorClasses[action.color] || 'bg-gray-50 text-gray-600'}`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {action.desc}
                                </p>
                            </div>
                        </div>

                        {/* Panah (Selalu di kanan) */}
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                    </Link>
                );
            })}
        </div>
      </div>
    </div>
  );
}