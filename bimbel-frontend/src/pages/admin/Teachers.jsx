// ============================================
// src/pages/admin/Teachers.jsx
// ============================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers', currentPage],
    queryFn: () => adminService.getTeachers({ page: currentPage, per_page: 15 }),
  });

  const teachers = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      education: '',
      bio: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: adminService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      setIsModalOpen(false);
      reset();
      toast.success('Pembimbing berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      setIsModalOpen(false);
      setEditingTeacher(null);
      reset();
      toast.success('Pembimbing berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      toast.success('Pembimbing berhasil dihapus');
    },
  });

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      reset({
        name: teacher.user?.name || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        specialization: teacher.specialization || '',
        education: teacher.education || '',
        bio: teacher.bio || '',
      });
    } else {
      setEditingTeacher(null);
      reset();
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
      message: `Apakah Anda yakin ingin menghapus pembimbing "${teacher.user?.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(teacher.id),
    });
  };

  const columns = [
    {
      header: 'Nama',
      render: (row) => row.user?.name || '-',
    },
    {
      header: 'Email',
      render: (row) => row.user?.email || '-',
    },
    {
      header: 'Spesialisasi',
      accessor: 'specialization',
    },
    {
      header: 'Pendidikan',
      accessor: 'education',
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembimbing</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola data pembimbing/guru</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Pembimbing
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={teachers} loading={isLoading} />
        {pagination && (
          <Pagination
            currentPage={pagination.current_page || currentPage}
            totalPages={pagination.last_page || 1}
            onPageChange={setCurrentPage}
            perPage={pagination.per_page || 15}
            total={pagination.total || 0}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
          reset();
        }}
        title={editingTeacher ? 'Edit Pembimbing' : 'Tambah Pembimbing Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Nama wajib diisi' })}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.email?.message}
            {...register('email', { required: 'Email wajib diisi' })}
          />
          {!editingTeacher && (
            <Input
              label="Password"
              type="password"
              required
              error={errors.password?.message}
              {...register('password', { required: 'Password wajib diisi' })}
            />
          )}
          <Input label="No. Telepon" {...register('phone')} />
          <Input label="Spesialisasi" {...register('specialization')} />
          <Input label="Pendidikan" {...register('education')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('bio')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTeacher(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTeacher ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}