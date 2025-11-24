// src/pages/admin/Subjects.jsx
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
  const [searchTerm, setSearchTerm] = useState('');

  // --- FETCH DATA ---
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['admin-subjects', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get('/admin/subjects', { params });
      return res.data.data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['admin-programs'],
    queryFn: async () => {
      const res = await api.get('/admin/programs');
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, setError, formState: { errors } } = useForm();

  // ... (Mutations, Handlers - SAMA) ...
  const createMutation = useMutation({
    mutationFn: async (data) => { const res = await api.post('/admin/subjects', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); setIsModalOpen(false); reset(); toast.success('Mata Pelajaran berhasil dibuat'); },
    onError: (err) => { const validationErrors = err.response?.data?.errors; if (validationErrors) { Object.keys(validationErrors).forEach((key) => { setError(key, { type: 'server', message: validationErrors[key][0] }); }); } else { toast.error(err.response?.data?.message || 'Gagal menyimpan'); } }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => { const res = await api.put(`/admin/subjects/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); setIsModalOpen(false); setEditingSubject(null); reset(); toast.success('Mata Pelajaran berhasil diperbarui'); },
    onError: (err) => { const validationErrors = err.response?.data?.errors; if (validationErrors) { Object.keys(validationErrors).forEach((key) => { setError(key, { type: 'server', message: validationErrors[key][0] }); }); } else { toast.error(err.response?.data?.message || 'Gagal menyimpan'); } }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id) => { await api.delete(`/admin/subjects/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries(['admin-subjects']); toast.success('Mata Pelajaran dihapus'); },
  });
  const handleOpenModal = (subject = null) => {
    if (subject) { setEditingSubject(subject); setValue('program_id', subject.program_id); setValue('name', subject.name); setValue('code', subject.code); setValue('description', subject.description); setValue('is_active', subject.is_active); } 
    else { setEditingSubject(null); reset({ is_active: true }); }
    setIsModalOpen(true);
  };
  const handleDelete = (subject) => { showConfirm({ title: 'Hapus Mata Pelajaran', message: `Yakin ingin menghapus ${subject.name}?`, confirmText: 'Hapus', type: 'danger', onConfirm: () => deleteMutation.mutate(subject.id), }); };
  const onSubmit = (data) => { if (editingSubject) { updateMutation.mutate({ id: editingSubject.id, data }); } else { createMutation.mutate(data); } };

  const columns = [
    { header: 'Kode', accessor: 'code', className: 'font-mono text-xs font-bold text-gray-600' },
    { header: 'Program', render: (row) => (<span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">{row.program?.name || '-'}</span>) },
    { header: 'Nama Mapel', accessor: 'name', className: 'font-medium text-gray-900' },
    { header: 'Status', render: (row) => (<span className={clsx('px-2 py-1 text-xs font-medium rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>{row.is_active ? 'Aktif' : 'Nonaktif'}</span>) },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          {/* [PERBAIKAN] Tombol Aksi dengan Teks */}
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mata Pelajaran</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Mapel</Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Cari mata pelajaran..." className="flex-1 border-none focus:ring-0 text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={subjects || []} loading={isLoading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Bimbel</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" {...register('program_id', { required: 'Program wajib dipilih' })}>
                <option value="">-- Pilih Program --</option>
                {programs?.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            {errors.program_id && <span className="text-red-500 text-xs">{errors.program_id.message}</span>}
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1"><Input label="Kode Mapel" placeholder="MAT-10" {...register('code', { required: 'Kode wajib diisi' })} error={errors.code?.message} /></div>
             <div className="col-span-2"><Input label="Nama Mata Pelajaran" placeholder="Matematika Dasar" {...register('name', { required: 'Nama wajib diisi' })} error={errors.name?.message} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">Deskripsi</label><textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" rows="3" {...register('description')}></textarea></div>
          <div className="flex items-center"><input type="checkbox" id="is_active" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" {...register('is_active')} /><label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Aktif</label></div>
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingSubject ? 'Simpan' : 'Buat Mapel'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}