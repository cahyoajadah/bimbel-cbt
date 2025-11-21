import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Book } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminSubjects() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // 1. Fetch Data Subjects
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects', currentPage],
    queryFn: () => adminService.getSubjects({ page: currentPage }),
  });

  const subjects = data?.data?.data || [];
  const pagination = data?.data || {}; // Sesuaikan struktur response Laravel pagination

  // 2. Setup Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // 3. Mutations (Create, Update, Delete)
  const createMutation = useMutation({
    mutationFn: adminService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      setIsModalOpen(false);
      reset();
      toast.success('Mata Pelajaran berhasil dibuat');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal membuat data')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      setIsModalOpen(false);
      setEditingSubject(null);
      reset();
      toast.success('Mata Pelajaran berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subjects']);
      toast.success('Mata Pelajaran berhasil dihapus');
    },
  });

  // 4. Handlers
  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      reset({
        name: subject.name,
        code: subject.code,
        description: subject.description,
        is_active: subject.is_active
      });
    } else {
      setEditingSubject(null);
      reset({ name: '', code: '', description: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (subject) => {
    showConfirm({
      title: 'Hapus Mata Pelajaran',
      message: `Hapus ${subject.name}? Ini mungkin mempengaruhi materi terkait.`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(subject.id),
    });
  };

  // 5. Table Columns
  const columns = [
    { header: 'Nama', accessor: 'name' },
    { header: 'Kode', accessor: 'code' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={clsx('px-2 py-1 text-xs rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {row.is_active ? 'Aktif' : 'Non-Aktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
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
          <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
          <p className="text-sm text-gray-600">Kelola daftar mata pelajaran bimbel</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Mapel</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={subjects} loading={isLoading} />
        {/* Render Pagination jika ada */}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nama Mapel" required {...register('name', { required: 'Wajib diisi' })} error={errors.name?.message} />
          <Input label="Kode Mapel (Opsional)" {...register('code')} placeholder="Contoh: MTK-10" />
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
             <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2" {...register('description')} rows={3} />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="is_active" className="rounded border-gray-300" {...register('is_active')} />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Aktif</label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}