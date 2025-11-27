import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, Clock, Calendar, TrendingUp, Video, ChevronRight, 
  MapPin, AlertCircle 
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch Dashboard Data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_DASHBOARD);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { stats, upcoming_schedules, recent_tryouts } = dashboardData || {};

  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang kembali! Siap untuk belajar hari ini?</p>
      </div>

      {/* Stats Cards - DIUBAH JADI 2 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Materi Selesai</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.completed_materials || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Rata-rata Tryout</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.average_score || 0}</h3>
          </div>
        </div>
        
        {/* KARTU KEHADIRAN DIHAPUS */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* JADWAL KEGIATAN */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" /> 
                    Jadwal Akan Datang
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate('/student/schedules')} 
                >
                    Lihat Semua <ChevronRight size={16} />
                </Button>
            </div>

            <div className="space-y-4 flex-1">
                {upcoming_schedules?.length > 0 ? (
                    upcoming_schedules.map((schedule) => (
                        <div key={schedule.id} className="flex gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg w-16 h-16 flex-shrink-0">
                                <span className="text-xs font-bold uppercase">{new Date(schedule.start_time).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                <span className="text-xl font-bold">{new Date(schedule.start_time).getDate()}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate">{schedule.title}</h4>
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <Clock size={14} />
                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    {schedule.class_type === 'zoom' ? (
                                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                            <Video size={12} /> Online (Zoom)
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                            <MapPin size={12} /> {schedule.location || 'Offline'}
                                        </span>
                                    )}
                                    {schedule.type === 'tryout' && (
                                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">Tryout</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                        <Calendar size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Belum ada jadwal dalam waktu dekat.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Recent Tryouts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-green-600" />
                    Hasil Tryout Terakhir
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-600 hover:bg-green-50"
                    onClick={() => navigate('/student/progress')}
                >
                    Lihat Progress <ChevronRight size={16} />
                </Button>
            </div>

            <div className="space-y-0 divide-y divide-gray-100 flex-1">
                {recent_tryouts?.length > 0 ? (
                    recent_tryouts.map((result) => (
                        <div key={result.id} className="py-3 flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/student/tryout-review/${result.id}`)}>
                            <div>
                                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {result.question_package?.name || 'Paket Soal'}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(result.created_at)}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={clsx(
                                    "text-lg font-bold",
                                    result.total_score >= (result.question_package?.passing_score || 0) ? "text-green-600" : "text-red-600"
                                )}>
                                    {result.total_score}
                                </span>
                                <p className="text-[10px] text-gray-400">Nilai Akhir</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                        <AlertCircle size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Belum ada riwayat tryout.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/student/tryouts')}>
                            Mulai Tryout
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}