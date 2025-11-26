import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, User, Mail, Phone, BookOpen, FileText } from 'lucide-react';
import api from '../../api/axiosConfig'; // Pastikan import api benar
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function AdminTeachers() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers', currentPage, search],
    queryFn: async () => {
        const res = await api.get(`/admin/teachers?page=${currentPage}&per_page=15&search=${search}`);
        return res.data; // Sesuaikan dengan response backend baru
    }
  });

  const teachers = data?.data?.data || [];
  const pagination = data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/admin/teachers', data),
    onSuccess: () => { 
        queryClient.invalidateQueries(['admin-teachers']); 
        setIsModalOpen(false); reset(); 
        toast.success('Pembimbing berhasil dibuat'); 
    },
    onError: (err) => toast.error('Gagal menyimpan data')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await api.put(`/admin/teachers/${id}`, data),
    onSuccess: () => { 
        queryClient.invalidateQueries(['admin-teachers']); 
        setIsModalOpen(false); setEditingTeacher(null); reset(); 
        toast.success('Pembimbing berhasil diperbarui'); 
    },
    onError: (err) => toast.error('Gagal update data')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/teachers/${id}`),
    onSuccess: () => { 
        queryClient.invalidateQueries(['admin-teachers']); 
        toast.success('Pembimbing berhasil dihapus'); 
    },
  });

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      // Data langsung dari object teacher, bukan teacher.user
      reset({ 
          name: teacher.name, 
          email: teacher.email, 
          phone: teacher.phone, 
          specialization: teacher.specialization, 
          education: teacher.education, 
          bio: teacher.bio 
      });
    } else { 
      setEditingTeacher(null); 
      reset({ name: '', email: '', phone: '', specialization: '', education: '', bio: '' }); 
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingTeacher) { 
        updateMutation.mutate({ id: editingTeacher.id, data }); 
    } else { 
        createMutation.mutate(data); 
    }
  };

  const handleDelete = (teacher) => {
    showConfirm({ 
        title: 'Hapus Pembimbing', 
        message: `Hapus data pembimbing "${teacher.name}"?`, 
        type: 'danger', 
        confirmText: 'Hapus', 
        onConfirm: () => deleteMutation.mutate(teacher.id) 
    });
  };

  const columns = [
    { 
        header: 'Nama', 
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                    {row.name?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">{row.specialization || '-'}</div>
                </div>
            </div>
        )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Pendidikan', accessor: 'education' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pembimbing</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola data guru dan mentor</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Pembimbing</Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari nama pembimbing..." 
            className="flex-1 border-none focus:ring-0 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={teachers} loading={isLoading} />
        {pagination && (
          <Pagination 
            currentPage={pagination.current_page || 1} 
            totalPages={pagination.last_page || 1} 
            onPageChange={setCurrentPage} 
            perPage={pagination.per_page || 15} 
            total={pagination.total || 0} 
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeacher ? 'Edit Pembimbing' : 'Tambah Pembimbing Baru'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Informasi Pribadi */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <User size={16}/> 1. Informasi Pribadi
            </h3>
            
            <Input label="Nama Lengkap" placeholder="Nama Guru" {...register('name', { required: 'Nama wajib diisi' })} error={errors.name?.message} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Email Kontak" type="email" icon={Mail} placeholder="email@sekolah.id" {...register('email')} />
                <Input label="Nomor HP / WA" type="tel" icon={Phone} placeholder="08..." {...register('phone')} />
            </div>
          </div>

          {/* Profil Profesional */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={16}/> 2. Profil Profesional
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                 <Input label="Spesialisasi / Mapel" placeholder="Contoh: Matematika" {...register('specialization')} />
                 <Input label="Pendidikan Terakhir" placeholder="Contoh: S1 Pendidikan" {...register('education')} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio Singkat</label>
                <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                    rows="2"
                    placeholder="Deskripsi singkat pengajar..."
                    {...register('bio')}
                ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingTeacher ? 'Perbarui Data' : 'Simpan Pembimbing'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}