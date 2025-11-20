// src/pages/student/Subjects.jsx
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function Subjects() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.SUBJECTS);
      return res.data.data;
    },
  });

  const subjects = data || [];

  if (isLoading) {
    return <LoadingSpinner text="Memuat mata pelajaran..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pilih mata pelajaran untuk mengakses materi pembelajaran
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`/student/subjects/${subject.id}/materials`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {subject.name}
            </h3>

            {subject.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {subject.description}
              </p>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="font-medium">
                {subject.materials_count || 0} Materi
              </span>
            </div>
          </Link>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada mata pelajaran tersedia</p>
        </div>
      )}
    </div>
  );
}