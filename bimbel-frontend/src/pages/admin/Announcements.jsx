import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Megaphone } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Fetch Data Pengumuman (Tabel - Pakai Pagination)
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-announcements', page, search],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}?page=${page}&search=${search}`);
      return res.data.data;
    },
  });

  // Fetch Data Program (Dropdown - Pakai ?all=true)
  const { data: programs } = useQuery({
    queryKey: ['admin-programs-list'], // Key khusus list
    queryFn: async () => {
      // [PERBAIKAN] Tambahkan ?all=true agar dapat Array, bukan Pagination
      const res = await api.get('/admin/programs?all=true'); 
      return res.data.data;
    },
  });

  const announcements = queryData?.data || [];
  const pagination = queryData;

  const { register, handleSubmit, reset, setValue } = useForm();

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (payload.program_id === "") payload.program_id = null;

      if (editingItem) return await api.put(`${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}/${editingItem.id}`, payload);
      return await api.post(API_ENDPOINTS.ADMIN_ANNOUNCEMENTS, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-announcements']);
      handleCloseModal();
      toast.success(editingItem ? 'Pengumuman diperbarui' : 'Pengumuman dibuat');
    },
    onError: () => toast.error('Gagal menyimpan pengumuman'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`${API_ENDPOINTS.ADMIN_ANNOUNCEMENTS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-announcements']);
      toast.success('Pengumuman dihapus');
    },
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setValue('title', item.title);
      setValue('content', item.content);
      setValue('program_id', item.program_id || "");
      setValue('is_active', item.is_active);
    } else {
      setEditingItem(null);
      reset({ is_active: true, program_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const columns = [
    { header: 'Judul', accessor: 'title', className: 'font-bold' },
    { 
        header: 'Target', 
        render: (row) => (
            <span className={clsx(
                "px-2 py-1 rounded text-xs font-medium border",
                row.program ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-700 border-gray-200"
            )}>
                {row.program ? row.program.name : "Semua Siswa"}
            </span>
        )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={clsx('px-2 py-1 text-xs rounded-full', row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
          {row.is_active ? 'Aktif' : 'Draft'}
        </span>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => showConfirm({ title: 'Hapus', message: 'Hapus pengumuman ini?', type: 'danger', onConfirm: () => deleteMutation.mutate(row.id) })} className="text-red-600">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Pengumuman</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Pengumuman</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border flex items-center gap-2 max-w-md">
        <Search className="text-gray-400" size={20}/>
        <input type="text" placeholder="Cari pengumuman..." className="flex-1 outline-none text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={announcements} loading={isLoading} />
        {pagination && <Pagination currentPage={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman'}>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <Input label="Judul" {...register('title', { required: true })} />
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Penerima</label>
              <select 
                  className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  {...register('program_id')}
              >
                  <option value="">Semua Siswa (Umum)</option>
                  {/* Programs sekarang pasti Array karena pakai ?all=true */}
                  {programs?.map(p => (
                      <option key={p.id} value={p.id}>Program: {p.name}</option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Pilih "Semua Siswa" untuk pengumuman umum.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
            <textarea className="w-full border-gray-300 rounded-lg p-2 border focus:ring-blue-500" rows="4" {...register('content', { required: true })}></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} className="rounded text-blue-600" id="active" />
            <label htmlFor="active" className="text-sm text-gray-700">Publikasikan Sekarang</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={saveMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}