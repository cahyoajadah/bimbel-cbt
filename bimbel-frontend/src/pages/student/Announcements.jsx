import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Calendar, MailOpen, Mail } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import clsx from 'clsx';

export default function StudentAnnouncements() {
  const queryClient = useQueryClient();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: announcementData, isLoading } = useQuery({
    queryKey: ['student-announcements-full'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_ANNOUNCEMENTS);
      return res.data.data;
    },
  });

  const announcements = announcementData?.data || [];

  // Mutation: Tandai Sudah Dibaca
  const readMutation = useMutation({
    mutationFn: async (id) => {
        await api.post(API_ENDPOINTS.ANNOUNCEMENT_READ(id));
    },
    onSuccess: () => {
        // Refresh data di halaman ini dan di Header (lonceng)
        queryClient.invalidateQueries(['student-announcements-full']);
        queryClient.invalidateQueries(['unread-announcements']);
    }
  });

  const handleOpenDetail = (item) => {
      setSelectedAnnouncement(item);
      setIsModalOpen(true);
      
      // Jika belum dibaca, tandai sudah dibaca
      if (!item.is_read) {
          readMutation.mutate(item.id);
      }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
             <Megaphone size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Papan Pengumuman</h1>
            <p className="text-gray-600">Informasi terbaru seputar kegiatan bimbel.</p>
          </div>
      </div>

      <div className="space-y-3">
        {announcements.length > 0 ? announcements.map((item) => (
            <div 
                key={item.id} 
                onClick={() => handleOpenDetail(item)}
                className={clsx(
                    "p-5 rounded-xl shadow-sm border cursor-pointer transition-all flex items-start gap-4 hover:shadow-md",
                    item.is_read ? "bg-gray-50 border-gray-200" : "bg-white border-blue-200 ring-1 ring-blue-100"
                )}
            >
                <div className={clsx("p-2 rounded-full shrink-0", item.is_read ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-600")}>
                    {item.is_read ? <MailOpen size={20}/> : <Mail size={20}/>}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className={clsx("text-lg truncate pr-4", item.is_read ? "font-medium text-gray-700" : "font-bold text-gray-900")}>
                            {item.title}
                        </h3>
                        <span className="text-xs text-gray-500 shrink-0 bg-white px-2 py-1 rounded border">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <p className={clsx("text-sm mt-1 line-clamp-2", item.is_read ? "text-gray-500" : "text-gray-700")}>
                        {item.content}
                    </p>
                </div>
            </div>
        )) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Belum ada pengumuman saat ini.</p>
            </div>
        )}
      </div>

      {/* Modal Detail Baca */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedAnnouncement?.title || 'Pengumuman'}
        size="lg"
      >
          <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 border-b pb-2">
                  <Calendar size={14} />
                  {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="prose max-w-none text-gray-800 whitespace-pre-line leading-relaxed text-base">
                  {selectedAnnouncement?.content}
              </div>
          </div>
      </Modal>
    </div>
  );
}