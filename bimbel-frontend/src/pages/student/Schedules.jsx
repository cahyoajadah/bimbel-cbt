// ============================================
// src/pages/student/Schedules.jsx
// ============================================
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/helpers';
import clsx from 'clsx';

export default function Schedules() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-schedules'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_SCHEDULES);
      return res.data.data;
    },
  });

  const schedules = data?.data || [];

  if (isLoading) {
    return <LoadingSpinner text="Memuat jadwal..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Bimbel</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lihat jadwal kelas dan tryout Anda
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={clsx(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    schedule.type === 'tryout' ? 'bg-purple-100' : 'bg-blue-100'
                  )}>
                    <Calendar className={clsx(
                      'w-6 h-6',
                      schedule.type === 'tryout' ? 'text-purple-600' : 'text-blue-600'
                    )} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {schedule.title}
                      </h3>
                      <span className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        schedule.type === 'tryout'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      )}>
                        {schedule.type === 'tryout' ? 'Tryout' : 'Kelas'}
                      </span>
                    </div>

                    {schedule.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {schedule.description}
                      </p>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatDateTime(schedule.start_time)} - {formatDateTime(schedule.end_time)}
                      </div>

                      {schedule.class_type === 'zoom' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Video className="w-4 h-4 mr-2" />
                          Online (Zoom)
                        </div>
                      )}

                      {schedule.class_type === 'offline' && schedule.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {schedule.location}
                        </div>
                      )}

                      {schedule.program && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium">
                            Program: {schedule.program.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {schedules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada jadwal tersedia</p>
        </div>
      )}
    </div>
  );
}
