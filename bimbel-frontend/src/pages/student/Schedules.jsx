import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react';
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
          {schedules.length > 0 ? schedules.map((schedule) => (
            <div key={schedule.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 w-full">
                  {/* Icon Tanggal */}
                  <div className={clsx(
                    'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border',
                    schedule.type === 'tryout' ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                  )}>
                    <span className="text-xs font-bold uppercase">{new Date(schedule.start_time).toLocaleDateString('id-ID', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{new Date(schedule.start_time).getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {schedule.title}
                      </h3>
                      <span className={clsx(
                        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border',
                        schedule.type === 'tryout'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {schedule.type === 'tryout' ? 'Tryout' : 'Kelas'}
                      </span>
                    </div>

                    {schedule.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {schedule.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 mt-3">
                      
                      {/* Waktu */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{formatDateTime(schedule.start_time)} - {new Date(schedule.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>

                      {/* Lokasi / Zoom */}
                      <div className="flex items-center gap-2">
                          {schedule.class_type === 'zoom' ? (
                             <>
                                <Video className="w-4 h-4 text-purple-500" />
                                <span className="text-purple-700 font-medium">Online (Zoom)</span>
                             </>
                          ) : (
                             <>
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span>{schedule.location || 'Offline'}</span>
                             </>
                          )}
                      </div>

                      {/* [BARU] Nama Pengajar */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{schedule.teacher?.name || 'Pengajar Belum Ditentukan'}</span>
                      </div>

                      {/* Program */}
                      {schedule.program && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center text-gray-400 font-bold text-xs border rounded-full border-gray-300">P</span>
                          <span>{schedule.program.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center">
               <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900">Belum ada jadwal</h3>
               <p className="text-gray-500 mt-1">Jadwal kelas dan tryout akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}