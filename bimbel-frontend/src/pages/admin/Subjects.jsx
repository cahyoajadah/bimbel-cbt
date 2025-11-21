import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Book } from 'lucide-react';
import { adminService } from '../../api/services/adminService'; // Pastikan import ini benar (bukan axiosInstance)
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminSubjects() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // 1. Fetch Data Subjects
  const { data: subjectData, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => adminService.getSubjects({ page: 1, per_page: 100 }), // Ambil semua dulu
  });

  // 2. Fetch Data Programs (Untuk Dropdown)
  const { data: programsData } = useQuery({
    queryKey: ['admin-programs-list'],
    queryFn: () => adminService.getPrograms(), // Pastikan fungsi ini ada di adminService
  });

  const subjects = subjectData?.data?.data || [];
  const programs = programsData?.data || []; // Sesuaikan struktur response program

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  // Pantau nilai is_active untuk UI Checkbox
  const isActive = watch('is_active');

  const createMutation = useMutation({
    mutationFn: adminService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      handleCloseModal();
      toast.success('Mata Pelajaran berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      handleCloseModal();
      toast.success('Mata Pelajaran berhasil diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      toast.success('Mata Pelajaran berhasil dihapus');
    },
  });

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      // Set value form. Untuk boolean, pastikan true/false
      setValue('name', subject.name);
      setValue('program_id', subject.program_id); // Set ID program yang terpilih
      setValue('code', subject.code);
      setValue('description', subject.description);
      setValue('is_active', subject.is_active ? true : false); // Force boolean
    } else {
      setEditingSubject(null);
      reset({ 
        name: '', 
        program_id: '', 
        code: '', 
        description: '', 
        is_active: true // Default aktif
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    reset();
  };

  const onSubmit = (data) => {
    const payload = {
        ...data,
        // Pastikan is_active dikirim sebagai 1 atau 0 agar Laravel mengerti
        is_active: data.is_active ? 1 : 0,
    };

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { 
      header: 'Program', 
      // Tampilkan Nama Program, bukan ID
      render: (row) => <span className="font-medium text-blue-600">{row.program?.name || '-'}</span>
    },
    { header: 'Mata Pelajaran', accessor: 'name' },
    { header: 'Kode', accessor: 'code' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={clsx('px-2 py-1 text-xs rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} 
            onClick={() => showConfirm({
              title: 'Hapus Mapel',
              message: 'Yakin hapus?',
              type: 'danger',
              confirmText: 'Hapus',
              onConfirm: () => deleteMutation.mutate(row.id)
            })} 
            className="text-red-600 hover:bg-red-50">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
          <p className="text-sm text-gray-600">Kelola daftar mata pelajaran per program</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Mapel</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={subjects} loading={isLoading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Dropdown Program */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Studi <span className="text-red-500">*</span>
            </label>
            <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                        {prog.name} {prog.level ? `(${prog.level})` : ''}
                    </option>
                ))}
            </select>
            {errors.program_id && <p className="text-red-500 text-xs mt-1">{errors.program_id.message}</p>}
          </div>

          <Input label="Nama Mapel" required {...register('name', { required: 'Wajib diisi' })} error={errors.name?.message} />
          <Input label="Kode Mapel" {...register('code')} />
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
             <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2" {...register('description')} rows={3} />
          </div>

          {/* Toggle Is Active */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <input 
                type="checkbox" 
                id="is_active" 
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                {...register('is_active')} 
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              Status Aktif (Siswa dapat melihat mapel ini)
            </label>
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