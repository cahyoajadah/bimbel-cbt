// ============================================
// src/pages/student/SubjectMaterials.jsx
// ============================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, FileText, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
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

  const { data: subject } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.SUBJECTS}/${subjectId}`);
      return res.data.data;
    },
  });

  const { data: materialsData, isLoading } = useQuery({
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

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">
            {subject?.name || 'Loading...'}
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
                  material.type === 'video' ? 'bg-red-100' : 'bg-blue-100'
                )}>
                  {material.type === 'video' ? (
                    <Video className="w-6 h-6 text-red-600" />
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
                    {material.duration_minutes && (
                      <span>{material.duration_minutes} menit</span>
                    )}
                    <span className="capitalize">{material.type}</span>
                  </div>
                </div>
              </div>

              {material.is_completed && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Selesai</span>
                </div>
              )}
            </div>

            {/* Video Player */}
            {material.type === 'video' && material.youtube_url && (
              <div className="mb-4">
                <iframe
                  className="w-full h-96 rounded-lg"
                  src={getYoutubeEmbedUrl(material.youtube_url)}
                  title={material.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* PDF Viewer */}
            {material.type === 'pdf' && material.pdf_url && (
              <div className="mb-4">
                <a
                  href={material.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka PDF
                </a>
              </div>
            )}

            {!material.is_completed && (
              <Button
                onClick={() => completeMutation.mutate(material.id)}
                loading={completeMutation.isPending}
                icon={CheckCircle}
              >
                Tandai Selesai
              </Button>
            )}
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada materi tersedia</p>
        </div>
      )}
    </div>
  );
}