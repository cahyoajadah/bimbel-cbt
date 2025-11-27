import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Lock, Save, BookOpen } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';

export default function Profile() {
  const queryClient = useQueryClient();

  // 1. Fetch User Data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data.data;
    },
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  // Set default values saat data dimuat
  useEffect(() => {
    if (userData) {
      setValue('name', userData.name);
      setValue('email', userData.email);
      setValue('phone', userData.phone);
      
      const programName = userData.student?.programs?.[0]?.name || '-';
      setValue('program_name', programName); 

      // Paksa kosongkan password agar tidak kena autofill
      setValue('password', '');
      setValue('password_confirmation', '');
    }
  }, [userData, setValue]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Kita bisa pakai JSON biasa karena tidak ada file upload lagi
      const payload = {
          name: data.name,
          phone: data.phone,
          _method: 'PUT' // Tetap kirim ini untuk konsistensi route Laravel
      };

      // Hanya kirim password jika diisi
      if (data.password && data.password.trim() !== '') {
          payload.password = data.password;
          payload.password_confirmation = data.password_confirmation;
      }

      const res = await api.post('/auth/profile', payload);
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

  if (isLoading) return <div className="p-8 text-center">Memuat profil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-blue-600" /> Profil Saya
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Biru Sederhana */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-8">
            <h2 className="text-white text-xl font-bold">Pengaturan Akun</h2>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Kolom Kiri: Info Dasar */}
                    <div className="space-y-5">
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
                            <p className="text-xs text-gray-500 mt-1">*Email tidak dapat diubah.</p>
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
                    <div className="space-y-5">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Ganti Password (Opsional)</h3>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-700 mb-2">
                            Kosongkan kolom ini jika Anda tidak ingin mengubah password saat ini.
                        </div>

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
                <div className="mt-10 flex justify-end pt-6 border-t border-gray-100">
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