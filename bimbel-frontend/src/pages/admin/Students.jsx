// src/pages/admin/Students.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState('');

  // 1. Fetch Data Students
  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', currentPage, search],
    queryFn: () => adminService.getStudents({ page: currentPage, search }),
  });

  // 2. Fetch Data Programs (Untuk Dropdown)
  const { data: programsData } = useQuery({
    queryKey: ['admin-programs-list'],
    queryFn: () => adminService.getPrograms(), 
  });

  const students = data?.data?.data || [];
  const pagination = data?.data || {};
  const programs = programsData?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      handleCloseModal();
      toast.success('Siswa berhasil ditambahkan');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      handleCloseModal();
      toast.success('Data siswa diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Siswa dihapus');
    },
  });

  // Handlers
  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      // Isi form dengan data siswa yang diedit
      setValue('name', student.user?.name);
      setValue('email', student.user?.email);
      setValue('phone', student.user?.phone); // HP Siswa
      
      setValue('school', student.school);
      setValue('birth_date', student.birth_date); 
      setValue('parent_name', student.parent_name); 
      setValue('parent_phone', student.parent_phone); 
      
      // Ambil program pertama yang dimiliki siswa (jika ada)
      if (student.programs && student.programs.length > 0) {
          setValue('program_id', student.programs[0].id);
      } else {
          setValue('program_id', '');
      }
    } else {
      // Reset form untuk siswa baru
      setEditingStudent(null);
      reset({
        name: '', 
        email: '', 
        password: '', 
        phone: '',
        school: '', 
        birth_date: '',
        parent_name: '',
        parent_phone: '',
        program_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    reset();
  };

  // --- PERBAIKAN UTAMA DI SINI (onSubmit) ---
  const onSubmit = (data) => {
    if (editingStudent) {
      // Clone data agar tidak mengubah object asli
      const payload = { ...data };
      
      // Hapus password dari payload jika kosong (agar tidak kena validasi min:8 di backend)
      if (!payload.password) {
        delete payload.password;
      }

      updateMutation.mutate({ id: editingStudent.id, data: payload });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { 
      header: 'Nama Siswa', 
      render: (row) => (
        <div>
            <div className="font-medium text-gray-900">{row.user?.name}</div>
            <div className="text-xs text-gray-500">{row.student_number}</div>
        </div>
      )
    },
    { header: 'Email', render: (row) => row.user?.email },
    { 
        header: 'Program', 
        render: (row) => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {row.programs?.[0]?.name || '-'}
            </span>
        )
    },
    { header: 'Asal Sekolah', accessor: 'school' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} 
            onClick={() => showConfirm({
                title: 'Hapus Siswa',
                message: 'Yakin hapus data siswa ini? Akun pengguna juga akan dihapus.',
                type: 'danger',
                confirmText: 'Hapus',
                onConfirm: () => deleteMutation.mutate(row.id)
            })} 
            className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
          <p className="text-sm text-gray-600">Kelola akun, data orang tua, dan program siswa</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Siswa</Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari nama, email, atau nama ortu..." 
            className="flex-1 border-none focus:ring-0 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={students} loading={isLoading} />
        <Pagination
            currentPage={pagination.current_page || 1}
            totalPages={pagination.last_page || 1}
            onPageChange={setCurrentPage}
            perPage={pagination.per_page || 15}
            total={pagination.total || 0}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* --- DATA AKUN --- */}
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Data Akun</h3>
            <div className="space-y-3">
              <Input label="Nama Lengkap Siswa" required {...register('name', { required: 'Wajib diisi' })} />
              <Input label="Email" type="email" required {...register('email', { required: 'Wajib diisi' })} />
              <Input label="No. HP Siswa (Opsional)" {...register('phone')} />
              
              {/* Password Field: Wajib untuk user baru, Opsional untuk edit */}
              {!editingStudent ? (
                <Input 
                  label="Password" 
                  type="password" 
                  required 
                  {...register('password', { required: 'Wajib diisi', minLength: { value: 8, message: 'Min 8 karakter' } })} 
                  error={errors.password?.message} 
                />
              ) : (
                <Input 
                  label="Password Baru (Kosongkan jika tidak ingin mengubah)" 
                  type="password" 
                  {...register('password', { minLength: { value: 8, message: 'Min 8 karakter' } })} 
                  error={errors.password?.message} 
                />
              )}
            </div>
          </div>

          {/* --- DATA PROGRAM --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Belajar <span className="text-red-500">*</span>
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

          {/* --- DATA PRIBADI & ORTU --- */}
          <div className="bg-gray-50 p-3 rounded-lg mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Data Pribadi & Orang Tua</h3>
            <div className="space-y-3">
              <Input label="Asal Sekolah" {...register('school')} />
              <Input label="Tanggal Lahir" type="date" {...register('birth_date')} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Nama Orang Tua" {...register('parent_name')} />
                <Input label="No. HP Orang Tua" {...register('parent_phone')} />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingStudent ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}