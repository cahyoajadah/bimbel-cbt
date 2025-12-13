// src/pages/student/SubjectMaterials.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, FileText, CheckCircle, ArrowLeft, BookOpen, File, Download, PlayCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { getYoutubeEmbedUrl } from '../../utils/helpers';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function SubjectMaterials() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State untuk materi yang sedang dibuka
  const [viewingMaterial, setViewingMaterial] = useState(null); 

  // Fetch Data Subject
  const { data: subject, isLoading: isSubjectLoading } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.SUBJECTS}/${subjectId}`);
      return res.data.data;
    },
  });

  // Fetch Data Materials
  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['subject-materials', subjectId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.SUBJECT_MATERIALS(subjectId));
      return res.data.data;
    },
  });

  const materials = materialsData || [];

  // Mutation: Tandai Selesai
  const completeMutation = useMutation({
    mutationFn: async (materialId) => {
      const res = await api.post(API_ENDPOINTS.MATERIAL_COMPLETE(materialId), {
        progress_percentage: 100,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subject-materials', subjectId]);
    },
  });

  // Handler Klik Tombol
  const handleViewMaterial = (material) => {
    // 1. Update progress di background
    if (!material.pivot?.is_completed) {
      completeMutation.mutate(material.id);
    }
    // 2. Buka Modal Fullscreen
    setViewingMaterial(material);
  };

  if (isSubjectLoading || isMaterialsLoading) {
    return <LoadingSpinner text="Memuat materi..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/student/subjects')}>
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject?.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{materials.length} Materi Tersedia</p>
        </div>
      </div>

      {/* Grid Materi */}
      <div className="space-y-4">
        {materials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={clsx(
                'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                material.type === 'video' ? 'bg-red-100' : material.type === 'pdf' ? 'bg-orange-100' : 'bg-blue-100'
              )}>
                {material.type === 'video' ? <Video className="w-6 h-6 text-red-600" /> : 
                 material.type === 'pdf' ? <File className="w-6 h-6 text-orange-600" /> : 
                 <FileText className="w-6 h-6 text-blue-600" />}
              </div>

              {/* Info & Tombol */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{material.title}</h3>
                  {material.pivot?.is_completed && (
                      <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" /> Selesai
                      </span>
                  )}
                </div>
                
                {material.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>}
                
                <div className="flex items-center gap-3 mt-4">
                  {/* Tombol Lihat Fullscreen */}
                  <Button
                      onClick={() => handleViewMaterial(material)}
                      icon={material.type === 'pdf' ? BookOpen : PlayCircle}
                      size="sm"
                      className={clsx(
                          material.type === 'pdf' ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                      )}
                  >
                      {material.type === 'pdf' ? 'Baca Fullscreen' : 'Tonton Video'}
                  </Button>

                  {/* Tombol Download (PDF Only & Allowed) */}
                  {material.type === 'pdf' && material.can_download == 1 && (
                      <a
                          href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${material.content}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors border border-gray-200"
                      >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                      </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center border-2 border-dashed border-gray-200">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada materi</h3>
          <p className="text-gray-500">Materi untuk mata pelajaran ini belum tersedia.</p>
        </div>
      )}

      {/* MODAL FULL SIZE VIEWER */}
      <Modal
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        title={viewingMaterial?.title || 'Materi'}
        size="full" // [PENTING] Menggunakan size 'full' yang sudah kita update
      >
        <div className="w-full h-full flex flex-col">
            {/* Konten Viewer */}
            <div className="flex-1 bg-gray-100 rounded overflow-hidden relative border border-gray-200">
                {viewingMaterial?.type === 'pdf' ? (
                    <>
                        <iframe
                            // #view=FitH untuk pas lebar
                            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${viewingMaterial.content}#toolbar=0&view=FitH`}
                            className="w-full h-full"
                            title="PDF Viewer"
                        />
                        {/* Proteksi Download jika tidak diizinkan */}
                        {!viewingMaterial.can_download && (
                            <div 
                                className="absolute inset-0 z-10" 
                                onContextMenu={(e) => e.preventDefault()}
                                style={{ pointerEvents: 'none' }}
                            />
                        )}
                    </>
                ) : viewingMaterial?.type === 'video' ? (
                    <iframe
                        className="w-full h-full"
                        src={getYoutubeEmbedUrl(viewingMaterial.content)}
                        title={viewingMaterial.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="p-8 prose max-w-none">
                        {viewingMaterial?.content}
                    </div>
                )}
            </div>

            {/* Footer Modal Custom (Optional Info) */}
            <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                <span>{viewingMaterial?.description ? viewingMaterial.description : 'Tidak ada deskripsi tambahan.'}</span>
                {viewingMaterial?.type === 'pdf' && viewingMaterial?.can_download == 1 && (
                     <a
                     href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${viewingMaterial?.content}`}
                     download
                     className="text-blue-600 hover:underline flex items-center font-semibold"
                 >
                     <Download className="w-4 h-4 mr-1" /> Download File Asli
                 </a>
                )}
            </div>
        </div>
      </Modal>
    </div>
  );
}