// ============================================
// src/pages/student/SubjectMaterials.jsx
// ============================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, FileText, CheckCircle, ArrowLeft, ExternalLink, BookOpen, File } from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getYoutubeEmbedUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function SubjectMaterials() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Data Detail Mapel (Nama, dll)
  // Tambahkan 'isLoading: isSubjectLoading' untuk memantau loading data ini
  const { data: subject, isLoading: isSubjectLoading } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.SUBJECTS}/${subjectId}`);
      return res.data.data;
    },
  });

  // 2. Fetch Data Materi
  // Ubah nama 'isLoading' jadi 'isMaterialsLoading' agar tidak bentrok
  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['subject-materials', subjectId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.SUBJECT_MATERIALS(subjectId));
      return res.data.data;
    },
  });

  const materials = materialsData || [];

  const completeMutation = useMutation({
    mutationFn: async (materialId) => {
      const res = await api.post(API_ENDPOINTS.MATERIAL_COMPLETE(materialId), {
        progress_percentage: 100,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subject-materials', subjectId]);
      toast.success('Materi ditandai selesai');
    },
  });

  // [PERBAIKAN UTAMA]
  // Tampilkan Spinner jika SALAH SATU data (Subject ATAU Materials) masih loading.
  // Ini memastikan saat tampilan muncul, Nama Mapel SUDAH ADA.
  if (isSubjectLoading || isMaterialsLoading) {
    return <LoadingSpinner text="Memuat materi..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/student/subjects')}
        >
          Kembali
        </Button>
        <div>
          {/* Sekarang subject.name pasti sudah ada karena kita menunggu loading selesai */}
          <h1 className="text-2xl font-bold text-gray-900">
            {subject?.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {materials.length} Materi Tersedia
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {materials.map((material) => (
          <div
            key={material.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={clsx(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  material.type === 'video' ? 'bg-red-100' : material.type === 'pdf' ? 'bg-orange-100' : 'bg-blue-100'
                )}>
                  {material.type === 'video' ? (
                    <Video className="w-6 h-6 text-red-600" />
                  ) : material.type === 'pdf' ? (
                    <File className="w-6 h-6 text-orange-600" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {material.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {/* Hapus logika duration_minutes jika di backend sudah dihapus kolomnya */}
                    <span className="capitalize font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">{material.type}</span>
                  </div>
                </div>
              </div>

              {material.pivot?.is_completed ? ( // Pastikan akses pivot benar
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span className="text-sm font-bold">Selesai</span>
                </div>
              ) : null}
            </div>

            {/* Video Player */}
            {material.type === 'video' && material.content && (
              <div className="mb-4">
                {/* Pastikan helper getYoutubeEmbedUrl menangani url biasa */}
                <iframe
                  className="w-full h-64 md:h-96 rounded-lg shadow-sm border border-gray-200"
                  src={getYoutubeEmbedUrl(material.content)}
                  title={material.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* PDF Viewer Link */}
            {material.type === 'pdf' && material.content && (
              <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <File className="text-orange-500" />
                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">Dokumen Materi PDF</span>
                </div>
                <a
                  // Asumsikan content adalah path relatif dari storage
                  href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${material.content}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka PDF
                </a>
              </div>
            )}
            
            {/* Text Content */}
            {material.type === 'text' && material.content && (
               <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 prose max-w-none text-sm text-gray-700">
                  {material.content}
               </div>
            )}

            {!material.pivot?.is_completed && (
              <Button
                onClick={() => completeMutation.mutate(material.id)}
                loading={completeMutation.isPending}
                icon={CheckCircle}
                className="mt-2"
              >
                Tandai Selesai
              </Button>
            )}
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
    </div>
  );
}