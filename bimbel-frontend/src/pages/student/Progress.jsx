// ============================================
// src/pages/student/Progress.jsx
// ============================================
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Award, BookOpen, MessageSquare } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

export default function Progress() {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PROGRESS);
      return res.data.data;
    },
  });

  const { data: feedbacksData } = useQuery({
    queryKey: ['student-feedbacks'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_FEEDBACKS);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Memuat progress..." />;
  }

  const progress = progressData || {};
  const feedbacks = feedbacksData || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progres Belajar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pantau perkembangan dan feedback dari admin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Materi Selesai</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {progress.materials_progress?.filter(m => m.pivot?.is_completed).length || 0}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Skor Terakhir</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {progress.last_tryout_score || 0}
              </p>
            </div>
            <Award className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tryout</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {progress.tryout_history?.length || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tryout History */}
      {progress.tryout_history && progress.tryout_history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Riwayat Tryout
          </h2>
          <div className="space-y-3">
            {progress.tryout_history.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {result.question_package?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(result.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {result.total_score}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round(result.percentage)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedbacks */}
      {feedbacks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Feedback dari Admin
          </h2>
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
              >
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {feedback.month}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(feedback.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {feedback.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}