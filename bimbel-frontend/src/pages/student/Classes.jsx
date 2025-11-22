// src/pages/student/Classes.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Video, Calendar, Clock, User, MapPin } from 'lucide-react';
import { studentService } from '../../api/services/studentService';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function StudentClasses() {
  // 1. Fetch Data dengan Filter 'zoom'
  const { data, isLoading } = useQuery({
    queryKey: ['student-classes-live'],
    queryFn: () => studentService.getClasses({ 
      class_type: 'zoom', // <--- FILTER PENTING: Hanya ambil kelas Zoom
      per_page: 20 
    }),
  });

  const classes = data?.data?.data || [];

  // Mutation untuk Join Kelas
  const joinMutation = useMutation({
    mutationFn: studentService.joinClass,
    onSuccess: (response) => {
      // Buka link zoom di tab baru
      if (response.data?.zoom_link) {
        window.open(response.data.zoom_link, '_blank');
        toast.success('Membuka Zoom...');
      } else {
        toast.error('Link Zoom tidak tersedia');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal join kelas');
    }
  });

  const handleJoin = (classId) => {
    joinMutation.mutate(classId);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelas Live (Zoom)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Jadwal kelas online interaktif kamu
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Video className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada kelas live</h3>
          <p className="mt-1 text-sm text-gray-500">Belum ada jadwal kelas Zoom untuk saat ini.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header Card */}
              <div className="p-5 border-b border-gray-100 bg-blue-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {item.program?.name || 'Umum'}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Body Card */}
              <div className="p-5 space-y-4">
                {/* Waktu */}
                <div className="flex items-start space-x-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(item.start_time), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                    </p>
                    <div className="flex items-center mt-1 text-blue-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(item.start_time), 'HH:mm')} - {format(new Date(item.end_time), 'HH:mm')} WIB
                    </div>
                  </div>
                </div>

                {/* Pengajar */}
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{item.teacher?.user?.name || 'Pengajar belum ditentukan'}</span>
                </div>

                {/* Tombol Join */}
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleJoin(item.id)}
                  loading={joinMutation.isPending && joinMutation.variables === item.id}
                  // Disable jika belum waktunya (opsional, hilangkan kondisi disabled jika ingin bisa join kapan saja)
                  // disabled={new Date() < new Date(item.start_time)} 
                >
                  Gabung Zoom
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}