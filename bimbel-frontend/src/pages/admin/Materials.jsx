import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FileText, Video, File, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Materials() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // State Filter
  const [selectedSubject, setSelectedSubject] = useState('');

  // Fetch Subjects (untuk dropdown filter & form)
  const { data: subjects } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => {
      // Endpoint admin/subjects harus mengembalikan array program
      const res = await api.get('/admin/subjects'); 
      return res.data.data;
    },
  });

  // Fetch Materials
  const { data: materials, isLoading } = useQuery({
    queryKey: ['admin-materials', selectedSubject],
    queryFn: async () => {
      const params = selectedSubject ? { subject_id: selectedSubject } : {};
      // Backend harus eager load 'subject.program'
      const res = await api.get('/admin/materials', { params }); 
      return res.data.data; // Mengambil data Array (tanpa pagination)
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const watchedType = watch('type', 'text');

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const data = new FormData();
      data.append('subject_id', formData.subject_id);
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('description', formData.description || '');
      
      // Mengirim content_url atau content_file sesuai tipe
      if (formData.type === 'pdf' && formData.content_file?.[0]) {
        data.append('content_file', formData.content_file[0]); // Mengirim file
      } else if (formData.content_url) {
        data.append('content_url', formData.content_url); // Mengirim URL/Teks
      }

      const res = await api.post('/admin/materials', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      setIsModalOpen(false);
      reset();
      toast.success('Materi berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat materi'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const data = new FormData();
      data.append('_method', 'PUT'); // Trick untuk PUT dengan FormData di Laravel
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('description', formData.description || '');

      if (formData.type === 'pdf' && formData.content_file?.[0]) {
        data.append('content_file', formData.content_file[0]);
      } else if (formData.content_url) {
        data.append('content_url', formData.content_url);
      }

      const res = await api.post(`/admin/materials/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      setIsModalOpen(false);
      setEditingMaterial(null);
      reset();
      toast.success('Materi berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      toast.success('Materi berhasil dihapus');
    },
  });

  // Handlers
  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setValue('subject_id', material.subject_id);
      setValue('title', material.title);
      setValue('type', material.type);
      setValue('description', material.description);
      // Asumsi: 'content' berisi URL/teks, atau path file
      setValue('content_url', material.content); 
    } else {
      setEditingMaterial(null);
      reset({ type: 'text' });
      if (selectedSubject) setValue('subject_id', selectedSubject);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (material) => {
    showConfirm({
      title: 'Hapus Materi',
      message: `Yakin ingin menghapus materi "${material.title}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(material.id),
    });
  };

  const onSubmit = (data) => {
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, formData: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Columns Definition
  const columns = [
    { 
      header: 'Urutan', 
      accessor: 'order_number',
      className: 'text-center w-16 font-bold text-gray-500' 
    },
    { 
      // [PERBAIKAN] Kolom Mata Pelajaran: Mengakses subject.name dan subject.program.name
      header: 'Mata Pelajaran', 
      render: (row) => (
          <div>
              <span className="font-medium text-gray-900">{row.subject?.name || '-'}</span>
              <div className="text-xs text-gray-500">{row.subject?.program?.name || '-'}</div>
          </div>
      )
    },
    { 
      header: 'Tipe', 
      render: (row) => {
        const icons = {
          video: <Video size={16} className="text-red-500" />,
          pdf: <File size={16} className="text-orange-500" />,
          text: <FileText size={16} className="text-blue-500" />,
        };
        return (
          <div className="flex items-center gap-2">
            {icons[row.type]} <span className="capitalize">{row.type}</span>
          </div>
        );
      }
    },
    { header: 'Judul', accessor: 'title' },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Materi</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Materi</Button>
      </div>

      {/* Filter Subject */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 w-full md:w-1/3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Mata Pelajaran</label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Semua Mata Pelajaran</option>
          {subjects?.map((sub) => (
            <option key={sub.id} value={sub.id}>{sub.name} - {sub.program?.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={materials || []} loading={isLoading} />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Subject Selection (Disabled jika edit atau sudah difilter) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register('subject_id', { required: 'Mata pelajaran wajib dipilih' })}
              disabled={editingMaterial}
            >
              <option value="">Pilih Mata Pelajaran</option>
              {subjects?.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name} - {sub.program?.name}</option>
              ))}
            </select>
            {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id.message}</p>}
          </div>

          <Input label="Judul Materi" {...register('title', { required: 'Judul wajib diisi' })} error={errors.title} />

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipe Materi</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register('type')}
            >
              <option value="text">Teks / Artikel</option>
              <option value="video">Video (YouTube/Link)</option>
              <option value="pdf">Dokumen PDF</option>
            </select>
          </div>

          {/* Dynamic Content Input */}
          {watchedType === 'pdf' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload File PDF</label>
              <input
                type="file"
                accept=".pdf"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                {...register('content_file', { required: !editingMaterial && watchedType === 'pdf' })}
              />
              {editingMaterial && <p className="text-xs text-gray-500 mt-1">Biarkan kosong jika tidak ingin mengubah file.</p>}
            </div>
          ) : (
            <Input 
              label={watchedType === 'video' ? 'Link Video (YouTube)' : 'Link Artikel / Konten'} 
              placeholder="https://..."
              {...register('content_url', { required: 'Link konten wajib diisi' })}
              error={errors.content_url}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="3"
              {...register('description')}
            ></textarea>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingMaterial ? 'Simpan Perubahan' : 'Buat Materi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}