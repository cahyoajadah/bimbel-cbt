import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Subjects() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [search, setSearch] = useState('');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['admin-subjects', search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const res = await api.get('/admin/subjects', { params });
      return res.data.data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['admin-programs'],
    queryFn: async () => (await api.get('/admin/programs')).data.data,
  });

  const { register, handleSubmit, reset, setValue, setError, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/admin/subjects', data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); handleCloseModal(); toast.success('Mata Pelajaran dibuat'); },
    onError: (err) => handleErrors(err),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/admin/subjects/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); handleCloseModal(); toast.success('Mata Pelajaran diperbarui'); },
    onError: (err) => handleErrors(err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); toast.success('Mata Pelajaran dihapus'); },
  });

  const handleErrors = (err) => {
    const validationErrors = err.response?.data?.errors;
    if (validationErrors) {
        Object.keys(validationErrors).forEach((key) => {
            setError(key, { type: 'server', message: validationErrors[key][0] });
        });
    } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setValue('program_id', subject.program_id);
      setValue('name', subject.name);
      setValue('code', subject.code);
      setValue('description', subject.description);
      setValue('is_active', subject.is_active);
    } else {
      setEditingSubject(null);
      reset({ is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    reset();
  };

  const onSubmit = (data) => {
    if (editingSubject) updateMutation.mutate({ id: editingSubject.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'Kode', accessor: 'code', className: 'font-mono text-xs font-bold text-gray-600' },
    { header: 'Program', render: (row) => <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">{row.program?.name || '-'}</span> },
    { header: 'Nama Mapel', accessor: 'name', className: 'font-medium text-gray-900' },
    { 
        header: 'Status', 
        render: (row) => (
            <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                {row.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
        )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          {/* TOMBOL EDIT TEXT */}
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          {/* TOMBOL HAPUS TEXT */}
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => showConfirm({ title: 'Hapus Mapel', message: `Hapus ${row.name}?`, type: 'danger', confirmText: 'Hapus', onConfirm: () => deleteMutation.mutate(row.id) })} className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Mata Pelajaran</h1>
            <p className="text-sm text-gray-600">Kelola mata pelajaran untuk setiap program</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Mapel</Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Cari mata pelajaran..." className="flex-1 border-none focus:ring-0 text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={subjects || []} loading={isLoading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Bimbel</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" {...register('program_id', { required: 'Program wajib dipilih' })}>
                <option value="">-- Pilih Program --</option>
                {programs?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1"><Input label="Kode Mapel" placeholder="MAT-10" {...register('code', { required: 'Kode wajib' })} error={errors.code?.message} /></div>
             <div className="col-span-2"><Input label="Nama Mata Pelajaran" placeholder="Matematika Dasar" {...register('name', { required: 'Nama wajib' })} error={errors.name?.message} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows="3" {...register('description')}></textarea>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="is_active" className="rounded text-blue-600" {...register('is_active')} /><label htmlFor="is_active" className="text-sm text-gray-700">Aktif</label></div>
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingSubject ? 'Simpan' : 'Buat Mapel'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}