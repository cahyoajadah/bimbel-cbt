// src/pages/admin/Students.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', currentPage, searchQuery],
    queryFn: () => adminService.getStudents({ 
      page: currentPage, 
      per_page: 15,
      search: searchQuery 
    }),
  });

  const students = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      birth_date: '',
      school: '',
      parent_name: '',
      parent_phone: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: adminService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      setIsModalOpen(false);
      reset();
      toast.success('Siswa berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      setIsModalOpen(false);
      setEditingStudent(null);
      reset();
      toast.success('Siswa berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Siswa berhasil dihapus');
    },
  });

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      reset({
        name: student.user?.name || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        birth_date: student.birth_date || '',
        school: student.school || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
      });
    } else {
      setEditingStudent(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (student) => {
    showConfirm({
      title: 'Hapus Siswa',
      message: `Apakah Anda yakin ingin menghapus siswa "${student.user?.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(student.id),
    });
  };

  const columns = [
    {
      header: 'No. Siswa',
      accessor: 'student_number',
    },
    {
      header: 'Nama',
      render: (row) => row.user?.name || '-',
    },
    {
      header: 'Email',
      render: (row) => row.user?.email || '-',
    },
    {
      header: 'Sekolah',
      accessor: 'school',
    },
    {
      header: 'Kehadiran',
      accessor: 'total_attendance',
    },
    {
      header: 'Skor Terakhir',
      render: (row) => row.last_tryout_score || '-',
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
          <h1 className="text-2xl font-bold text-gray-900">Siswa</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola data siswa</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Siswa
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari siswa..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={students} loading={isLoading} />
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
          setEditingStudent(null);
          reset();
        }}
        title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Lengkap"
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
          {!editingStudent && (
            <Input
              label="Password"
              type="password"
              required
              error={errors.password?.message}
              {...register('password', { required: 'Password wajib diisi', minLength: 6 })}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="No. Telepon" {...register('phone')} />
            <Input label="Tanggal Lahir" type="date" {...register('birth_date')} />
          </div>
          <Input label="Sekolah" {...register('school')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nama Orang Tua" {...register('parent_name')} />
            <Input label="No. Telepon Orang Tua" {...register('parent_phone')} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingStudent(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingStudent ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
