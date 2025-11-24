import { useQuery } from '@tanstack/react-query';
import { MessageSquare, User, Calendar } from 'lucide-react';
import api from '../../api/axiosConfig';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';


export default function StudentFeedbacks() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-feedbacks'],
    queryFn: async () => {
      const res = await api.get('/student/feedbacks');
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const feedbacks = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Umpan Balik & Evaluasi</h1>
        <p className="text-gray-600">Pesan dan masukan dari pembimbing untuk perkembangan belajarmu.</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Belum ada masukan</h3>
            <p className="text-gray-500">Rajinlah belajar dan ikuti tryout agar pembimbing bisa memberikan evaluasi.</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {feedbacks.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-50 p-3 rounded-full shrink-0">
                            <User className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{item.admin_name || 'Admin Akademik'}</h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                "{item.content}"
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}