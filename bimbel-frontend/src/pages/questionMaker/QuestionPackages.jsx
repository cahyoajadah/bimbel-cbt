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

  // Fetch Programs
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
      
      // [PERBAIKAN] Set Passing Grade Total & Kategori
      setValue('passing_score', pkg.passing_score);
      setValue('passing_grade_twk', pkg.passing_grade_twk || 0);
      setValue('passing_grade_tiu', pkg.passing_grade_tiu || 0);
      setValue('passing_grade_tkp', pkg.passing_grade_tkp || 0);
      
      setValue('max_attempts', pkg.max_attempts);
      
      setValue('start_date', pkg.start_date ? pkg.start_date.split('T')[0] : '');
      setValue('end_date', pkg.end_date ? pkg.end_date.split('T')[0] : '');      
    } else {
      setEditingPackage(null);
      // [PERBAIKAN] Reset form dengan default value yang benar
      reset({ 
          duration_minutes: 120, 
          passing_score: 0,
          passing_grade_twk: 0,
          passing_grade_tiu: 0,
          passing_grade_tkp: 0,
          max_attempts: '', // Default kosong (unlimited)
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
    const payload = { ...data, is_active: true }; 
    
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;
    
    if (!payload.max_attempts || payload.max_attempts == 0) {
        payload.max_attempts = null;
    }

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
      header: 'Limit', 
      render: (row) => (
        <span className="text-xs font-medium text-gray-600">
            {row.max_attempts ? `${row.max_attempts}x` : '∞'}
        </span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => {
        const now = new Date();
        const startDate = row.start_date ? new Date(row.start_date) : null;
        const endDate = row.end_date ? new Date(row.end_date) : null;
        if(endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && now < startDate) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Belum Mulai</span>;
        }
        if (endDate && now > endDate) {
            return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Selesai</span>;
        }
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Tersedia</span>;
      }
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" icon={List} onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)}>
            Soal
          </Button>
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50">
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
          </div>

          {/* [PERBAIKAN] Input Passing Grade SKD menggunakan register React Hook Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Pengaturan Passing Grade (SKD)</h4>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Min. TWK"
                    type="number"
                    {...register('passing_grade_twk')}
                    className="bg-white"
                    placeholder="0"
                />
                <Input
                    label="Min. TIU"
                    type="number"
                    {...register('passing_grade_tiu')}
                    className="bg-white"
                    placeholder="0"
                />
                <Input
                    label="Min. TKP"
                    type="number"
                    {...register('passing_grade_tkp')}
                    className="bg-white"
                    placeholder="0"
                />
                <Input
                    label="Min. Total"
                    type="number"
                    {...register('passing_score')}
                    className="bg-white"
                    placeholder="0"
                />
            </div>
            <p className="text-xs text-gray-500 mt-2">* Isi 0 jika tidak ada passing grade khusus.</p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <Input 
                type="number" 
                label="Batas Pengerjaan (Kali)" 
                placeholder="Kosongkan jika unlimited"
                {...register('max_attempts', { min: 1 })} 
                className="bg-white"
            />
            <p className="text-xs text-yellow-800 mt-1">
                * Kosongkan jika siswa diperbolehkan mengerjakan berulang kali tanpa batas.
            </p>
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