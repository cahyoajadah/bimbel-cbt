import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, List, Layers, X, Calendar, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// [HELPER] Format tanggal untuk input datetime-local
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().slice(0, 16);
};

// [HELPER] Format tampilan tanggal
const formatDateDisplay = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function QuestionPackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  
  // State Modal Paket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // State Modal Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // --- DATA FETCHING ---
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['question-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
      return res.data.data; // Mengambil object pagination
    },
  });

  // Handle data pagination dari Laravel
  const packages = packagesData?.data || []; 

  const { data: programs } = useQuery({
    queryKey: ['common-programs'], 
    queryFn: async () => {
      const res = await api.get('/programs'); 
      return res.data.data;
    },
  });

  // --- FORM HANDLING (PAKET) ---
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // --- MUTATIONS (PAKET) ---
  const createMutation = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.QUESTION_PACKAGES, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      reset();
      toast.success('Paket soal berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat paket'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      setEditingPackage(null);
      reset();
      toast.success('Paket soal berhasil diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update paket'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      toast.success('Paket soal dihapus');
    },
  });

  // --- HANDLERS (PAKET) ---
  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setValue('program_id', pkg.program_id);
      setValue('name', pkg.name);
      setValue('description', pkg.description);
      setValue('duration_minutes', pkg.duration_minutes);
      setValue('passing_score', pkg.passing_score);
      setValue('max_attempts', pkg.max_attempts || 0);
      
      // [FIX] Set tanggal ke input datetime-local
      setValue('start_date', formatDateTimeLocal(pkg.start_date));
      setValue('end_date', formatDateTimeLocal(pkg.end_date));
    } else {
      setEditingPackage(null);
      reset({ 
          duration_minutes: 100, 
          passing_score: 0, 
          max_attempts: 0,
          start_date: '',
          end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (pkg) => {
    showConfirm({
      title: 'Hapus Paket Soal',
      message: `Yakin ingin menghapus paket "${pkg.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(pkg.id),
    });
  };

  const onSubmit = (data) => {
    // Validasi Tanggal
    if (new Date(data.end_date) <= new Date(data.start_date)) {
        return toast.error("Waktu selesai harus setelah waktu mulai.");
    }

    const payload = { ...data };
    // Normalisasi max_attempts (0 => null handled by backend logic or send 0)
    
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // --- MANAJEMEN KATEGORI (Desain Lama Dipertahankan) ---
  const handleManageCategories = (pkg) => {
    setSelectedPackage(pkg);
    setIsCategoryModalOpen(true);
  };

  const CategoryManager = ({ pkg }) => {
    const { register: regCat, handleSubmit: submitCat, reset: resetCat } = useForm();
    const queryClient = useQueryClient();

    const { data: pkgDetail, isLoading: isLoadingCat } = useQuery({
        queryKey: ['question-package-detail', pkg.id],
        queryFn: async () => {
            const res = await api.get(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}`);
            return res.data.data;
        }
    });

    const addCategoryMutation = useMutation({
        mutationFn: (data) => api.post(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}/categories`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['question-package-detail', pkg.id]);
            resetCat();
            toast.success('Kategori ditambahkan');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal tambah kategori')
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (catId) => api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}/categories/${catId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['question-package-detail', pkg.id]);
            toast.success('Kategori dihapus');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Gagal hapus kategori')
    });

    const onAddCategory = (data) => {
        addCategoryMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={submitCat(onAddCategory)} className="flex gap-3 items-end bg-gray-50 p-4 rounded-lg border">
                <div className="flex-1">
                    <Input label="Nama Kategori" placeholder="Contoh: TIU" {...regCat('name', { required: true })} className="bg-white" />
                </div>
                <div className="w-32">
                    <Input label="Passing Grade" type="number" placeholder="0" {...regCat('passing_grade', { required: true })} className="bg-white" />
                </div>
                <Button type="submit" loading={addCategoryMutation.isPending} icon={Plus}>Tambah</Button>
            </form>

            <div>
                <h3 className="font-bold text-gray-700 mb-2">Daftar Kategori</h3>
                {isLoadingCat ? <p>Loading...</p> : (
                    <div className="space-y-2">
                        {pkgDetail?.categories?.length > 0 ? pkgDetail.categories.map((cat) => (
                            <div key={cat.id} className="flex justify-between items-center p-3 border rounded bg-white shadow-sm">
                                <div>
                                    <span className="font-semibold text-gray-800">{cat.name}</span>
                                    <span className="ml-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        PG: {cat.passing_grade}
                                    </span>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => {
                                        if(confirm('Hapus kategori ini?')) deleteCategoryMutation.mutate(cat.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic">Belum ada kategori.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const columns = [
    { 
      header: 'Nama Paket', 
      render: (row) => (
        <div>
            <div className="font-bold text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.program?.name}</div>
        </div>
      )
    },
    { header: 'Durasi', accessor: 'duration_minutes', render: (row) => `${row.duration_minutes} Menit` },
    { 
      header: 'Limit', 
      render: (row) => (
        <span className="text-xs font-medium text-gray-600">
            {row.max_attempts ? `${row.max_attempts}x` : '∞'}
        </span>
      )
    },
    // [FIX] Kolom Status diganti dengan Periode Aktif yang lebih informatif
    { 
      header: 'Periode Aktif', 
      render: (row) => {
        const now = new Date();
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const isActive = now >= start && now <= end;

        return (
            <div className="text-xs space-y-1">
                <div className={`font-bold ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {isActive ? '● Sedang Tayang' : '○ Tidak Tayang'}
                </div>
                <div className="text-gray-500 text-[10px]">
                    {formatDateDisplay(row.start_date)} - {formatDateDisplay(row.end_date)}
                </div>
            </div>
        );
      }
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" icon={List} onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)} title="Kelola Soal">
            Soal
          </Button>
          <Button size="sm" variant="outline" icon={Layers} onClick={() => handleManageCategories(row)} title="Kelola Kategori">
            Kategori
          </Button>
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bank Soal & Paket</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Paket Baru</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={packages} loading={isLoading} emptyMessage="Belum ada paket soal." />
      </div>

      {/* MODAL BUAT/EDIT PAKET */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nama Paket" placeholder="Contoh: Tryout SKD 1" {...register('name', { required: 'Nama wajib diisi' })} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select 
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Durasi Total (Menit)" {...register('duration_minutes', { required: true, min: 1 })} />
            <Input type="number" label="Passing Score Global" placeholder="0" {...register('passing_score', { required: true, min: 0 })} />
          </div>

          {/* [FIX] INPUT TANGGAL (Gantikan Checkbox Aktif) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
              <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <Calendar size={16} /> Jadwal Masa Aktif
              </h4>
              <div className="grid grid-cols-1 gap-3">
                  <Input 
                    label="Waktu Mulai" 
                    type="datetime-local" 
                    {...register('start_date', { required: 'Wajib diisi' })} 
                    className="bg-white"
                  />
                  <Input 
                    label="Waktu Selesai" 
                    type="datetime-local" 
                    {...register('end_date', { required: 'Wajib diisi' })} 
                    className="bg-white"
                  />
              </div>
              <div className="flex items-start gap-2 text-blue-600 text-xs bg-blue-100/50 p-2 rounded">
                  <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                  <p>Paket soal hanya akan muncul di akun siswa jika waktu saat ini berada di antara waktu mulai dan selesai.</p>
              </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <Input type="number" label="Batas Pengerjaan (Kali)" placeholder="0 = Unlimited" {...register('max_attempts')} className="bg-white" />
            <p className="text-xs text-gray-500 mt-1 ml-1">Isi <strong>0</strong> untuk pengerjaan tak terbatas.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL MANAJEMEN KATEGORI */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={`Kategori Soal: ${selectedPackage?.name}`}
        size="lg"
      >
        {selectedPackage && <CategoryManager pkg={selectedPackage} />}
      </Modal>
    </div>
  );
}