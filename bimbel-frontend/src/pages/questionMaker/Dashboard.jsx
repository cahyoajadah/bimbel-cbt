// src/pages/questionMaker/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Package, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import clsx from 'clsx';

export default function QuestionMakerDashboard() {
  const { data: packages } = useQuery({
    queryKey: ['question-maker-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
      return res.data.data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ['question-reports-count'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_REPORTS, {
        params: { status: 'pending' }
      });
      return res.data.data;
    },
  });

  const stats = [
    {
      title: 'Total Paket Soal',
      value: packages?.data?.length || 0,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Soal',
      value: packages?.data?.reduce((sum, pkg) => sum + (pkg.total_questions || 0), 0) || 0,
      icon: FileText,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Pengaduan Pending',
      value: reports?.data?.length || 0,
      icon: AlertCircle,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Paket Aktif',
      value: packages?.data?.filter(p => p.is_active).length || 0,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Pembuat Soal</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola paket soal dan pertanyaan tryout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/question-maker/packages"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola Paket Soal</h3>
            <p className="text-sm text-gray-600 mt-1">Buat dan edit paket soal</p>
          </a>

          <a
            href="/question-maker/reports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <AlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
            <h3 className="font-medium text-gray-900">Pengaduan Soal</h3>
            <p className="text-sm text-gray-600 mt-1">Lihat laporan dari siswa</p>
          </a>
        </div>
      </div>
    </div>
  );
}
