// src/pages/admin/ContentManager.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Image as ImageIcon, FileText, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Table from '../../components/common/Table';
import toast from 'react-hot-toast';

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('blog'); // 'blog' or 'gallery'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  // --- Form State ---
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    preview: null,
  });

  // --- Fetch Data ---
  const { data: contents, isLoading } = useQuery({
    queryKey: ['admin-contents', activeTab],
    queryFn: async () => {
      // Fetch berdasarkan section (blog/gallery)
      const res = await api.get(`${API_ENDPOINTS.ADMIN_CONTENTS}?section=${activeTab}`);
      return res.data.data;
    },
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const form = new FormData();
      form.append('section', activeTab);
      form.append('title', data.title);
      form.append('content', data.content || ''); // Gallery mungkin null content
      form.append('is_active', 1);
      if (data.image) form.append('image', data.image);
      
      return await api.post(API_ENDPOINTS.ADMIN_CONTENTS, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contents']);
      setIsModalOpen(false);
      resetForm();
      toast.success('Konten berhasil ditambahkan');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambah konten'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const form = new FormData();
      // Method spoofing for Laravel PUT with File
      form.append('_method', 'PUT'); 
      form.append('title', data.title);
      form.append('content', data.content || '');
      form.append('section', activeTab);
      if (data.image) form.append('image', data.image);

      return await api.post(`${API_ENDPOINTS.ADMIN_CONTENTS}/${selectedItem.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['admin-contents']);
        setIsModalOpen(false);
        resetForm();
        toast.success('Konten berhasil diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update konten'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`${API_ENDPOINTS.ADMIN_CONTENTS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contents']);
      setIsDeleteOpen(false);
      toast.success('Konten dihapus');
    },
  });

  // --- Handlers ---
  const resetForm = () => {
    setFormData({ title: '', content: '', image: null, preview: null });
    setSelectedItem(null);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title,
        content: item.content || '',
        image: null,
        preview: item.image ? `http://localhost:8000/storage/${item.image}` : null,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file, preview: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItem) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // --- Columns Config ---
  const columns = [
    { 
        header: 'Gambar', 
        accessor: (item) => (
            item.image ? 
            <img src={`http://localhost:8000/storage/${item.image}`} alt="thumb" className="w-16 h-16 object-cover rounded" /> 
            : <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
        ) 
    },
    { header: 'Judul', accessor: 'title', className: 'font-medium' },
    { 
        header: 'Tanggal', 
        accessor: (item) => new Date(item.created_at).toLocaleDateString('id-ID') 
    },
    {
      header: 'Aksi',
      accessor: (item) => (
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Konten</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah {activeTab === 'blog' ? 'Artikel' : 'Galeri'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all ${
                activeTab === 'blog' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            <FileText className="w-4 h-4 mr-2" /> Blog
        </button>
        <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all ${
                activeTab === 'gallery' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            <ImageIcon className="w-4 h-4 mr-2" /> Galeri
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
            <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
            <Table columns={columns} data={contents || []} />
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${selectedItem ? 'Edit' : 'Tambah'} ${activeTab === 'blog' ? 'Blog' : 'Galeri'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Judul"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          {/* Content hanya wajib untuk Blog */}
          {activeTab === 'blog' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konten / Isi Artikel</label>
                <textarea
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                />
              </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
            <div className="flex items-center space-x-4">
                {formData.preview && (
                    <img src={formData.preview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                )}
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(selectedItem.id)}
        title="Hapus Konten"
        message="Apakah Anda yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}