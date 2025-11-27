import { useQuery } from '@tanstack/react-query';
import { Megaphone, Calendar } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function StudentAnnouncements() {
  const { data: announcementData, isLoading } = useQuery({
    queryKey: ['student-announcements-full'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_ANNOUNCEMENTS);
      return res.data.data; // paginate object
    },
  });

  const announcements = announcementData?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
             <Megaphone size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Papan Pengumuman</h1>
            <p className="text-gray-600">Informasi terbaru seputar kegiatan bimbel.</p>
          </div>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? announcements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        <Calendar size={12} /> 
                        {new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="prose max-w-none text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                    {item.content}
                </div>
            </div>
        )) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Belum ada pengumuman saat ini.</p>
            </div>
        )}
      </div>
    </div>
  );
}