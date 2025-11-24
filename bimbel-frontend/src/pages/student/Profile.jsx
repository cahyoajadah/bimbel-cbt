import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Lock, Camera, Save, BookOpen } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';

export default function Profile() {
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState(null);

  // 1. Fetch User Data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Set default values saat data dimuat
  useEffect(() => {
    if (userData) {
      setValue('name', userData.name);
      setValue('email', userData.email);
      setValue('phone', userData.phone);
      
      const programName = userData.student?.programs?.[0]?.name || '-';
      setValue('program_name', programName); 
      
      if (userData.avatar) {
          const avatarUrl = userData.avatar.startsWith('http') 
            ? userData.avatar 
            : `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${userData.avatar}`;
          setAvatarPreview(avatarUrl);
      }

      // [PERBAIKAN] Paksa kosongkan password agar tidak kena autofill
      setValue('password', '');
      setValue('password_confirmation', '');
    }
  }, [userData, setValue]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('_method', 'PUT'); 
      
      formData.append('name', data.name);
      formData.append('phone', data.phone);

      // Hanya kirim password jika diisi
      if (data.password && data.password.trim() !== '') {
          formData.append('password', data.password);
          formData.append('password_confirmation', data.password_confirmation);
      }

      if (data.avatar?.[0]) {
          formData.append('avatar', data.avatar[0]);
      }

      const res = await api.post('/auth/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      toast.success('Profil berhasil diperbarui');
      setValue('password', ''); 
      setValue('password_confirmation', '');
    },
    onError: (err) => {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            const firstError = Object.values(validationErrors)[0][0];
            toast.error(firstError);
        } else {
            toast.error(err.response?.data?.message || 'Gagal update profil');
        }
    }
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const handleAvatarChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setAvatarPreview(URL.createObjectURL(file));
      }
  };

  if (isLoading) return <div className="p-8 text-center">Memuat profil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-blue-600" /> Profil Saya
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header / Cover Kecil */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>

        <div className="px-8 pb-8">
            
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                {/* Avatar Section */}
                <div className="relative -mt-16 mb-6 flex justify-center sm:justify-start">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md group">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User size={64} />
                                </div>
                            )}
                        </div>
                        <label 
                            htmlFor="avatar-upload" 
                            className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors text-blue-600"
                            title="Ganti Foto"
                        >
                            <Camera size={20} />
                            <input 
                                id="avatar-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                {...register('avatar')}
                                onChange={(e) => {
                                    register('avatar').onChange(e);
                                    handleAvatarChange(e);
                                }}
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kolom Kiri: Info Dasar */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informasi Akun</h3>
                        
                        <Input 
                            label="Nama Lengkap" 
                            icon={User}
                            {...register('name', { required: 'Nama wajib diisi' })}
                            error={errors.name?.message}
                        />
                        
                        {/* Email Read-only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input 
                                    type="email" 
                                    readOnly
                                    disabled
                                    className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0 focus:border-gray-300"
                                    {...register('email')}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">*Email tidak dapat diubah karena digunakan sebagai username.</p>
                        </div>

                        <Input 
                            label="Nomor Telepon" 
                            type="tel"
                            icon={Phone}
                            {...register('phone')}
                        />
                        
                        {/* Program Disabled */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program Belajar</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <BookOpen size={18} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    readOnly
                                    disabled
                                    className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0 focus:border-gray-300"
                                    {...register('program_name')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Ganti Password */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Ganti Password (Opsional)</h3>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-700 mb-2">
                            Kosongkan kolom ini jika Anda tidak ingin mengubah password saat ini.
                        </div>

                        {/* [PERBAIKAN] autoComplete="new-password" untuk mencegah autofill */}
                        <Input 
                            label="Password Baru" 
                            type="password"
                            icon={Lock}
                            placeholder="Minimal 8 karakter"
                            autoComplete="new-password" 
                            {...register('password')}
                        />

                        <Input 
                            label="Konfirmasi Password" 
                            type="password"
                            icon={Lock}
                            placeholder="Ulangi password baru"
                            autoComplete="new-password"
                            {...register('password_confirmation')}
                        />
                    </div>
                </div>

                {/* Tombol Simpan */}
                <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                    <Button 
                        type="submit" 
                        loading={updateMutation.isPending} 
                        className="px-8"
                        icon={Save}
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}