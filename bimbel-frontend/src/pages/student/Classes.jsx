// ============================================
// src/pages/student/Classes.jsx
// ============================================
import { useQuery } from '@tanstack/react-query';
import { Video, MapPin, Clock, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Classes() {
  const { data: upcomingClasses, isLoading } = useQuery({
    queryKey: ['student-classes-upcoming'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CLASSES_UPCOMING);
      return res.data.data;
    },
  });

  const { data: allClasses } = useQuery({
    queryKey: ['student-classes-all'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CLASSES);
      return res.data.data;
    },
  });

  const handleJoinClass = async (classId) => {
    try {
      const res = await api.post(API_ENDPOINTS.CLASS_JOIN(classId));
      const zoomLink = res.data.data.zoom_link;
      
      if (zoomLink) {
        window.open(zoomLink, '_blank');
        toast.success('Membuka link Zoom...');
      } else {
        toast.error('Link Zoom tidak tersedia');
      }
    } catch (error) {
      toast.error('Gagal join kelas');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Memuat kelas..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelas Live</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bergabung dengan kelas online atau offline
        </p>
      </div>

      {/* Upcoming Classes */}
      {upcomingClasses && upcomingClasses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kelas Mendatang
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {classItem.title}
                    </h3>
                    {classItem.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {classItem.description}
                      </p>
                    )}
                  </div>
                  <div className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    classItem.class_type === 'zoom'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  )}>
                    {classItem.class_type === 'zoom' ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatDateTime(classItem.start_time)}
                  </div>

                  {classItem.class_type === 'offline' && classItem.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {classItem.location}
                    </div>
                  )}

                  {classItem.teacher && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">
                        Pengajar: {classItem.teacher.user?.name}
                      </span>
                    </div>
                  )}
                </div>

                {classItem.class_type === 'zoom' && (
                  <Button
                    onClick={() => handleJoinClass(classItem.id)}
                    icon={ExternalLink}
                    className="w-full"
                  >
                    Join Kelas
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Classes */}
      {allClasses && allClasses.data && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Semua Kelas
          </h2>
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {allClasses.data.map((classItem) => (
                <div key={classItem.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {classItem.class_type === 'zoom' ? (
                          <Video className="w-6 h-6 text-blue-600" />
                        ) : (
                          <MapPin className="w-6 h-6 text-green-600" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {classItem.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(classItem.start_time)}
                        </p>
                        {classItem.class_type === 'offline' && classItem.location && (
                          <p className="text-sm text-gray-500 mt-1">
                            📍 {classItem.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      classItem.class_type === 'zoom'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    )}>
                      {classItem.class_type === 'zoom' ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(!upcomingClasses || upcomingClasses.length === 0) &&
       (!allClasses || !allClasses.data || allClasses.data.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada kelas tersedia</p>
        </div>
      )}
    </div>
  );
}