// src/pages/student/Profile.jsx
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, Calendar, School, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authService } from '../../api/services/authService';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  });

  const profile = profileData?.data || user;
  const student = profile?.student;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      school: '',
      parent_name: '',
      parent_phone: '',
    },
  });

  // [PERBAIKAN PENTING]
  // Hanya lakukan reset form saat data berubah.
  // JANGAN panggil updateUser() di sini agar tidak terjadi Infinite Loop.
  useEffect(() => {
    if (profile && student) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        address: student.address || '',
        school: student.school || '',
        birth_date: student.birth_date || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
      });
    }
  }, [profile, student, reset]);

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      toast.success('Profil berhasil diperbarui');
      // Update store hanya saat user secara sadar melakukan "Simpan"
      updateUser(data.data); 
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Logout berhasil');
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola informasi profil Anda
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
            <p className="text-gray-600">{student?.student_number}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
              {student?.programs?.[0]?.name || 'Belum ada program'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 text-gray-600">
            <Mail className="w-5 h-5" />
            <span>{profile?.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-600">
            <Phone className="w-5 h-5" />
            <span>{profile?.phone || '-'}</span>
          </div>
          {student?.birth_date && (
            <div className="flex items-center space-x-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(student.birth_date)}</span>
            </div>
          )}
          {student?.school && (
            <div className="flex items-center space-x-3 text-gray-600">
              <School className="w-5 h-5" />
              <span>{student.school}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Profil
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Lengkap"
            {...register('name', { required: 'Nama wajib diisi' })}
            error={errors.name?.message}
          />

          <Input
            label="No. Telepon"
            {...register('phone')}
          />

          {/* Program Belajar (Read Only) */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Belajar
            </label>
            <div className="text-gray-900 font-medium">
              {student?.programs?.[0]?.name || '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              *Program belajar ditentukan oleh admin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('address')}
            />
          </div>

          <Input
            label="Sekolah"
            {...register('school')}
          />
          
          <Input
            label="Tanggal Lahir"
            type="date"
            {...register('birth_date')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Orang Tua"
              {...register('parent_name')}
            />
            <Input
              label="No. Telepon Orang Tua"
              {...register('parent_phone')}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={updateMutation.isPending}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Keluar Akun
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Keluar dari akun Anda dan kembali ke halaman login
        </p>
        <Button
          variant="danger"
          icon={LogOut}
          onClick={handleLogout}
          loading={logoutMutation.isPending}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}