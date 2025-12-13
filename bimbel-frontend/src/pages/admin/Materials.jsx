import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FileText, Video, File } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function Materials() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'pdf',
    can_download: false, // Default false
    // ...
  });



  const { data: subjects } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => (await api.get('/admin/subjects')).data.data,
  });

  const { data: materials, isLoading } = useQuery({
    queryKey: ['admin-materials', selectedSubject],
    queryFn: async () => {
      const params = selectedSubject ? { subject_id: selectedSubject } : {};
      return (await api.get('/admin/materials', { params })).data.data;
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const watchedType = watch('type', 'text');

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const data = new FormData();
      data.append('subject_id', formData.subject_id);
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('description', formData.description || '');
      data.append('can_download', formData.can_download ? '1' : '0');
      if (formData.type === 'pdf' && formData.content_file?.[0]) data.append('content_file', formData.content_file[0]);
      else if (formData.content_url) data.append('content_url', formData.content_url);
      return (await api.post('/admin/materials', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-materials']); handleCloseModal(); toast.success('Materi berhasil dibuat'); },
    onError: (err) => toast.error('Gagal membuat materi'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const data = new FormData();
      data.append('_method', 'PUT');
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('description', formData.description || '');
      data.append('can_download', formData.can_download ? '1' : '0');
      if (formData.type === 'pdf' && formData.content_file?.[0]) data.append('content_file', formData.content_file[0]);
      else if (formData.content_url) data.append('content_url', formData.content_url);
      return (await api.post(`/admin/materials/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-materials']); handleCloseModal(); toast.success('Materi diperbarui'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/materials/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-materials']); toast.success('Materi dihapus'); },
  });

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setValue('subject_id', material.subject_id);
      setValue('title', material.title);
      setValue('type', material.type);
      setValue('description', material.description);
      setValue('content_url', material.content); 
      setValue('can_download', Boolean(material.can_download));
    } else {
      setEditingMaterial(null);
      reset({ 
        type: 'text', 
        can_download: false // Default false
      });
      if (selectedSubject) setValue('subject_id', selectedSubject);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingMaterial(null); reset(); };

  const onSubmit = (data) => {
    if (editingMaterial) updateMutation.mutate({ id: editingMaterial.id, formData: data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'Urutan', accessor: 'order_number', className: 'text-center w-16 font-bold text-gray-500' },
    { header: 'Mata Pelajaran', render: (row) => (<div><span className="font-medium text-gray-900">{row.subject?.name || '-'}</span><div className="text-xs text-gray-500">{row.subject?.program?.name || '-'}</div></div>) },
    { header: 'Tipe', render: (row) => {
        const icons = { video: <Video size={16} className="text-red-500" />, pdf: <File size={16} className="text-orange-500" />, text: <FileText size={16} className="text-blue-500" /> };
        return <div className="flex items-center gap-2">{icons[row.type]} <span className="capitalize">{row.type}</span></div>;
    }},
    { header: 'Judul', accessor: 'title' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => showConfirm({ title: 'Hapus Materi', message: `Hapus ${row.title}?`, type: 'danger', confirmText: 'Hapus', onConfirm: () => deleteMutation.mutate(row.id) })} className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Materi</h1>
            <p className="text-sm text-gray-600">Upload video, pdf, atau teks materi</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Materi</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 w-full md:w-1/3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Mata Pelajaran</label>
        <select className="w-full border-gray-300 rounded-md shadow-sm p-2 border" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          <option value="">Semua Mata Pelajaran</option>
          {subjects?.map((sub) => <option key={sub.id} value={sub.id}>{sub.name} - {sub.program?.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={materials || []} loading={isLoading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" {...register('subject_id', { required: 'Wajib dipilih' })} disabled={editingMaterial}>
              <option value="">Pilih Mata Pelajaran</option>
              {subjects?.map((sub) => <option key={sub.id} value={sub.id}>{sub.name} - {sub.program?.name}</option>)}
            </select>
          </div>
          <Input label="Judul Materi" {...register('title', { required: 'Wajib diisi' })} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipe Materi</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" {...register('type')}>
              
              <option value="video">Video (YouTube)</option>
              <option value="pdf">Dokumen PDF</option>
            </select>
          </div>
          {watchedType === 'pdf' ? (
  <div className="space-y-3"> {/* Bungkus dengan div agar rapi */}
    
    {/* 1. Input File PDF (Sudah ada) */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Upload File PDF</label>
      <input 
        type="file" 
        accept=".pdf" 
        className="mt-1 block w-full text-sm text-gray-500" 
        {...register('content_file', { required: !editingMaterial && watchedType === 'pdf' })} 
      />
    </div>

    {/* 2. TAMBAHKAN INI: Checkbox Izin Download */}
    <div className="flex items-center">
      <input
        id="can_download"
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        {...register('can_download')}
      />
      <label htmlFor="can_download" className="ml-2 block text-sm text-gray-900">
        Izinkan siswa mendownload file ini?
      </label>
    </div>
    
  </div>
) : (
  <Input 
    label={watchedType === 'video' ? 'Link Video' : 'Link Artikel'} 
    placeholder="https://..." 
    {...register('content_url', { required: 'Link konten wajib diisi' })} 
  />
)}
          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows="3" {...register('description')}></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingMaterial ? 'Simpan' : 'Buat Materi'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}