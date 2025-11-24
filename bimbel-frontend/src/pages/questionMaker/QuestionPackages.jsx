import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, List, Calendar } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function QuestionPackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // Fetch Data Packages
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['question-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
      return res.data.data;
    },
  });

  const packages = packagesData?.data || []; 

  // Fetch Programs (Gunakan endpoint umum)
  const { data: programs } = useQuery({
    queryKey: ['common-programs'], 
    queryFn: async () => {
      const res = await api.get('/programs'); 
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.QUESTION_PACKAGES, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      reset();
      toast.success('Paket soal berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat paket'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      setEditingPackage(null);
      reset();
      toast.success('Paket soal berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      toast.success('Paket soal dihapus');
    },
  });

  // Handlers
  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setValue('program_id', pkg.program_id);
      setValue('name', pkg.name);
      setValue('description', pkg.description);
      setValue('duration_minutes', pkg.duration_minutes);
      setValue('passing_score', pkg.passing_score);
      
      setValue('start_date', pkg.start_date ? pkg.start_date.split('T')[0] : '');
      setValue('end_date', pkg.end_date ? pkg.end_date.split('T')[0] : '');
      
      setValue('is_active', pkg.is_active);
    } else {
      setEditingPackage(null);
      reset({ 
          is_active: true, 
          duration_minutes: 120, 
          passing_score: 65,
          start_date: '',
          end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (pkg) => {
    showConfirm({
      title: 'Hapus Paket Soal',
      message: `Yakin ingin menghapus paket "${pkg.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(pkg.id),
    });
  };

  const onSubmit = (data) => {
    const payload = { ...data };
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { 
      header: 'Nama Paket', 
      render: (row) => (
        <div>
            <div className="font-bold text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.program?.name}</div>
        </div>
      )
    },
    { header: 'Durasi', accessor: 'duration_minutes', render: (row) => `${row.duration_minutes} Menit` },
    { 
      header: 'Periode Aktif', 
      render: (row) => (
        <div className="text-xs">
            {row.start_date ? (
                <div className="flex items-center gap-1 text-gray-700">
                    <Calendar size={12} />
                    {new Date(row.start_date).toLocaleDateString('id-ID')} - 
                    {row.end_date ? new Date(row.end_date).toLocaleDateString('id-ID') : 'Seterusnya'}
                </div>
            ) : (
                <span className="text-gray-400 italic">Selalu Aktif</span>
            )}
        </div>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          {/* TOMBOL SOAL */}
          <Button 
            size="sm" 
            variant="outline" 
            icon={List} 
            onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)}
          >
            Soal
          </Button>
          
          {/* TOMBOL EDIT (DENGAN TEKS) */}
          <Button 
            size="sm" 
            variant="ghost" 
            icon={Edit} 
            onClick={() => handleOpenModal(row)}
          >
            Edit
          </Button>

          {/* TOMBOL HAPUS (DENGAN TEKS) */}
          <Button 
            size="sm" 
            variant="ghost" 
            icon={Trash2} 
            onClick={() => handleDelete(row)} 
            className="text-red-600 hover:bg-red-50"
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bank Soal</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Paket Baru</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={packages} loading={isLoading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <Input label="Nama Paket" placeholder="Contoh: Tryout SKD 1" {...register('name', { required: 'Nama wajib diisi' })} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select 
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" 
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
                type="number" 
                label="Durasi (Menit)" 
                {...register('duration_minutes', { required: true, min: 1 })} 
            />
            <Input 
                type="number" 
                label="KKM / Passing Score" 
                {...register('passing_score', { required: true, min: 0 })} 
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <label className="block text-sm font-bold text-blue-800 mb-2">Periode Aktif (Opsional)</label>
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" label="Mulai Tanggal" {...register('start_date')} className="bg-white" />
                <Input type="date" label="Sampai Tanggal" {...register('end_date')} className="bg-white" />
              </div>
              <p className="text-xs text-blue-600 mt-1">* Kosongkan jika paket ini berlaku selamanya.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea 
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" 
                rows="2" 
                {...register('description')}
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('is_active')} className="rounded text-blue-600" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Paket Aktif</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingPackage ? 'Simpan' : 'Buat Paket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}