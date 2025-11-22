// ============================================
// src/pages/questionMaker/QuestionPackages.jsx
// ============================================
// src/pages/questionMaker/QuestionPackages.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FileText, Clock, CheckCircle, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { adminService } from '../../api/services/adminService'; // Gunakan service yang ada getPrograms
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function QuestionPackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [search, setSearch] = useState('');

  // 1. Fetch Question Packages
  const { data, isLoading } = useQuery({
    queryKey: ['question-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
      return res.data;
    },
  });

  // 2. Fetch Programs (Untuk Dropdown)
  // Kita bisa menggunakan adminService.getPrograms() karena endpointnya public/shared untuk admin & question maker
  const { data: programsData } = useQuery({
    queryKey: ['programs-list'],
    // Gunakan getPublicPrograms agar Pembuat Soal diizinkan akses
    queryFn: () => adminService.getPublicPrograms(), 
  });

  const packages = data?.data?.data || []; // Sesuaikan struktur response pagination
  const programs = programsData?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.QUESTION_PACKAGES, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      handleCloseModal();
      toast.success('Paket soal berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      handleCloseModal();
      toast.success('Paket soal diperbarui');
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

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setValue('name', pkg.name);
      setValue('description', pkg.description);
      setValue('program_id', pkg.program_id); // Set Program ID
      setValue('duration_minutes', pkg.duration_minutes);
      setValue('passing_score', pkg.passing_score);
      setValue('is_active', pkg.is_active);
    } else {
      setEditingPackage(null);
      reset({
        name: '',
        description: '',
        program_id: '',
        duration_minutes: 120,
        passing_score: 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    reset();
  };

  const onSubmit = (data) => {
    const payload = {
        ...data,
        is_active: data.is_active ? 1 : 0, // Pastikan boolean dikirim sebagai 1/0 jika perlu
    };

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
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
        </div>
      ),
    },
    {
        header: 'Program',
        render: (row) => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {row.program?.name || '-'}
            </span>
        )
    },
    {
      header: 'Info',
      render: (row) => (
        <div className="flex flex-col space-y-1 text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" /> {row.duration_minutes} m
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" /> KKM: {row.passing_score}
          </div>
          <div className="flex items-center">
            <FileText className="w-3 h-3 mr-1" /> {row.total_questions || 0} Soal
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={clsx('px-2 py-1 text-xs rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
          {row.is_active ? 'Aktif' : 'Draft'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)}>
            Soal
          </Button>
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} className="text-red-600" 
            onClick={() => showConfirm({
              title: 'Hapus Paket',
              message: 'Yakin hapus paket soal ini?',
              type: 'danger',
              onConfirm: () => deleteMutation.mutate(row.id)
            })} 
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Soal</h1>
          <p className="text-sm text-gray-600">Kelola paket soal tryout</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Paket</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={packages} loading={isLoading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPackage ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* DROPDOWN PROGRAM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Program <span className="text-red-500">*</span>
            </label>
            <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>{prog.name}</option>
                ))}
            </select>
            {errors.program_id && <p className="text-red-500 text-xs mt-1">{errors.program_id.message}</p>}
          </div>

          <Input label="Nama Paket" required {...register('name', { required: 'Wajib diisi' })} />
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
             <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2" {...register('description')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Durasi (menit)" type="number" {...register('duration_minutes', { required: true })} />
            <Input label="Passing Score" type="number" {...register('passing_score')} />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="active" className="rounded border-gray-300" {...register('is_active')} />
            <label htmlFor="active" className="text-sm text-gray-700">Aktifkan Paket ini</label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}