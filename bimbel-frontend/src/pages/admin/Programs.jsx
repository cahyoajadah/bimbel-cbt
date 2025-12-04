import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Programs() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // --- FETCH DATA ---
  const { data: programsData, isLoading } = useQuery({
    queryKey: ['admin-programs-manage', currentPage, search],
    queryFn: async () => {
      const res = await api.get(`/admin/programs?page=${currentPage}&search=${search}`);
      return res.data.data;
    },
  });

  const programs = programsData?.data || [];
  const pagination = programsData;

  const { register, handleSubmit, reset, setValue, setError, formState: { errors } } = useForm();

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/admin/programs', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-programs-manage']);
      queryClient.invalidateQueries(['admin-programs-list']); 
      handleCloseModal();
      toast.success('Program berhasil dibuat');
    },
    onError: (err) => {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            Object.keys(validationErrors).forEach((key) => {
                setError(key, { type: 'server', message: validationErrors[key][0] });
            });
        } else {
            toast.error(err.response?.data?.message || 'Gagal menyimpan');
        }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/admin/programs/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-programs-manage']);
      queryClient.invalidateQueries(['admin-programs-list']);
      handleCloseModal();
      toast.success('Program diperbarui');
    },
    onError: (err) => {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            Object.keys(validationErrors).forEach((key) => {
                setError(key, { type: 'server', message: validationErrors[key][0] });
            });
        } else {
            toast.error(err.response?.data?.message || 'Gagal update');
        }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-programs-manage']);
      queryClient.invalidateQueries(['admin-programs-list']);
      toast.success('Program dihapus');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus (sedang digunakan)'),
  });

  // --- HANDLERS ---
  const handleOpenModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setValue('code', program.code); // [BARU]
      setValue('name', program.name);
      setValue('description', program.description);
      setValue('is_active', program.is_active);
    } else {
      setEditingProgram(null);
      reset({ code: '', name: '', description: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
    reset();
  };

  const onSubmit = (data) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (program) => {
    showConfirm({
      title: 'Hapus Program',
      message: `Yakin hapus program "${program.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(program.id),
    });
  };

  // --- TABEL ---
  const columns = [
    { 
      header: 'Kode', 
      accessor: 'code',
      className: 'font-mono text-xs font-bold text-gray-600 w-24'
    },
    { 
      header: 'Nama Program', 
      accessor: 'name',
      className: 'font-bold text-gray-900'
    },
    { 
        header: 'Deskripsi', 
        render: (row) => <span className="text-sm text-gray-600 line-clamp-1">{row.description || '-'}</span>
    },
    { 
        header: 'Status', 
        render: (row) => (
            <span className={clsx(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                row.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            )}>
                {row.is_active ? <CheckCircle size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                {row.is_active ? 'Aktif' : 'Nonaktif'}
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
          <h1 className="text-2xl font-bold text-gray-800">Program Bimbel</h1>
          <p className="text-sm text-gray-600">Kelola daftar program belajar (Jurusan)</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Program</Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari program..." 
            className="flex-1 border-none focus:ring-0 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={programs} loading={isLoading} />
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProgram ? 'Edit Program' : 'Tambah Program Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1">
                <Input 
                    label="Kode" 
                    placeholder="SKD" 
                    {...register('code', { required: 'Kode wajib' })} 
                    error={errors.code?.message} 
                />
             </div>
             <div className="col-span-2">
                <Input 
                    label="Nama Program" 
                    placeholder="SKD CPNS 2025" 
                    {...register('name', { required: 'Nama wajib' })} 
                    error={errors.name?.message} 
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Deskripsi singkat program..."
                {...register('description')}
            ></textarea>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input type="checkbox" id="isActive" {...register('is_active')} className="rounded text-blue-600 w-4 h-4" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Program Aktif</label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingProgram ? 'Simpan Perubahan' : 'Buat Program'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}