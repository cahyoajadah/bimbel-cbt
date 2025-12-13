// src/pages/admin/ContentManager.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Image as ImageIcon, FileText, MessageCircle, HelpCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';

// Components
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';

// Import React Quill & Styles
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Style editor
import 'katex/dist/katex.min.css'; // Style untuk matematika
import katex from 'katex'; 
window.katex = katex; // Mount katex ke window agar dikenali Quill

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('blog'); // Default tab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    preview: null,
  });

  // Helper untuk Label Dinamis
  const getLabels = () => {
    switch(activeTab) {
        case 'testimony': return { title: 'Nama Klien / Siswa', content: 'Isi Testimoni', image: 'Foto Profil' };
        case 'faq': return { title: 'Pertanyaan (Question)', content: 'Jawaban (Answer)', image: null }; // FAQ tanpa gambar
        case 'gallery': return { title: 'Judul Foto', content: 'Deskripsi Singkat', image: 'File Gambar' };
        default: return { title: 'Judul Artikel', content: 'Isi Konten', image: 'Gambar Cover' };
    }
  };

  const labels = getLabels();

  // Konfigurasi Toolbar Editor (Warna, Background, Align)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }], 
      [{ 'align': [] }], 
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image', 'formula'], 
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background', 
    'align', 
    'list', 'bullet',
    'link', 'image', 'formula'
  ];

  // Fetch Data
  const { data: contents, isLoading } = useQuery({
    queryKey: ['admin-contents', activeTab],
    queryFn: async () => {
      // Mengambil data berdasarkan section (blog, gallery, testimony, faq)
      const res = await api.get(`${API_ENDPOINTS.ADMIN_CONTENTS}?section=${activeTab}`);
      return res.data.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const form = new FormData();
      form.append('section', activeTab);
      form.append('title', data.title);
      form.append('content', data.content || '');
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

  // Handlers
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

  // Columns Config
  const columns = [
    // Kolom Gambar: Tampilkan hanya jika bukan FAQ
    ...(activeTab !== 'faq' ? [{ 
        header: activeTab === 'testimony' ? 'Foto' : 'Gambar', 
        accessor: 'image',
        render: (item) => (
            item.image ? 
            <img src={`http://localhost:8000/storage/${item.image}`} alt="thumb" className="w-16 h-16 object-cover rounded" /> 
            : <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
        ) 
    }] : []),
    
    { header: labels.title, accessor: 'title', className: 'font-medium' },
    
    // Preview Konten Singkat
    {
        header: labels.content.split(' ')[0], // Ambil kata pertama (Isi/Jawaban)
        accessor: 'content',
        render: (item) => (
            <div 
                className="truncate max-w-xs text-gray-600 text-sm"
                dangerouslySetInnerHTML={{ __html: item.content?.replace(/<[^>]+>/g, '') || '-' }}
            />
        )
    },

    { 
        header: 'Tanggal', 
        accessor: 'created_at',
        render: (item) => new Date(item.created_at).toLocaleDateString('id-ID') 
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (item) => (
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

  // Helper Tabs Class
  const getTabClass = (name) => `px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all ${
    activeTab === name ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
  }`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Konten Landing Page</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('blog')} className={getTabClass('blog')}>
            <FileText className="w-4 h-4 mr-2" /> Blog
        </button>
        <button onClick={() => setActiveTab('gallery')} className={getTabClass('gallery')}>
            <ImageIcon className="w-4 h-4 mr-2" /> Galeri
        </button>
        <button onClick={() => setActiveTab('testimony')} className={getTabClass('testimony')}>
            <MessageCircle className="w-4 h-4 mr-2" /> Testimoni
        </button>
        <button onClick={() => setActiveTab('faq')} className={getTabClass('faq')}>
            <HelpCircle className="w-4 h-4 mr-2" /> FAQ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table 
            columns={columns} 
            data={contents || []} 
            loading={isLoading}
            emptyMessage={`Belum ada data untuk ${activeTab}.`}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${selectedItem ? 'Edit' : 'Tambah'} ${activeTab.toUpperCase()}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={labels.title}
            placeholder={activeTab === 'faq' ? 'Contoh: Berapa biaya pendaftarannya?' : ''}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          {/* Editor React Quill */}
          <div className="mb-12"> 
            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.content}</label>
            <div className="h-64"> 
                <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={modules}
                    formats={formats}
                    className="h-56"
                    placeholder={activeTab === 'faq' ? 'Tulis jawaban di sini...' : 'Tulis konten...'}
                />
            </div>
          </div>

          {/* Panduan LaTeX hanya muncul di Blog */}
          {activeTab === 'blog' && (
            <div className="mt-8 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                <p className="font-bold mb-1">Panduan Rumus Matematika (LaTeX):</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc pl-4">
                  <li>Pecahan: <code className="bg-gray-200 px-1 rounded">{"\\frac{a}{b}"}</code> → {"$\\frac{a}{b}$"}</li>
                  <li>Pangkat: <code className="bg-gray-200 px-1 rounded">{"x^2"}</code> → {"$x^2$"}</li>
                  <li>Akar: <code className="bg-gray-200 px-1 rounded">{"\\sqrt{x}"}</code> → {"$\\sqrt{x}$"}</li>
                  <li>Kali: <code className="bg-gray-200 px-1 rounded">{"\\times"}</code> → {"$\\times$"}</li>
                </ul>
                <p className="mt-2 text-gray-500">
                Klik tombol <b>fx</b> di toolbar, lalu tempel kode di atas.
                </p>
            </div>
          )}

          {/* Image Upload (Disembunyikan jika label.image null / FAQ) */}
          {labels.image && (
            <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.image}</label>
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
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              Simpan
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