import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, List, Layers, Calendar, AlertCircle, Clock } from 'lucide-react';
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

// [HELPER UTAMA] Konversi Waktu Server ke Format Input HTML (Wajib WIB)
// Format output: "YYYY-MM-DDTHH:mm" (Untuk datetime-local / Live)
const formatToWIBInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  
  const datePart = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', { 
      timeZone: 'Asia/Jakarta',
      hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);

  return `${datePart}T${timePart}`;
};

// [HELPER BARU] Format Tanggal Saja (YYYY-MM-DD) sesuai Timezone Asia/Jakarta
// [FIX] Ini kunci agar tanggal tidak mundur 1 hari saat Edit (Flexible Mode)
const formatDateOnlyWIB = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Paksa timezone Jakarta, output YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
};

// [HELPER] Format Tampilan di Tabel (WIB)
const displayDateWIB = (dateString, isLive) => {
    if (!dateString) return '∞';
    const date = new Date(dateString);
    
    const options = { 
        timeZone: 'Asia/Jakarta',
        day: 'numeric', 
        month: 'short', 
        year: isLive ? undefined : 'numeric', 
        hour: isLive ? '2-digit' : undefined,
        minute: isLive ? '2-digit' : undefined
    };
    
    if(!isLive) options.year = 'numeric';

    return date.toLocaleString('id-ID', options);
};

// --- SUB-COMPONENT: MANAGER KATEGORI ---
const CategoryManager = ({ pkg }) => {
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  const { data: pkgDetail, isLoading } = useQuery({
    queryKey: ['package-categories', pkg.id],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}`);
      return res.data.data;
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data) => api.post(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}/categories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['package-categories', pkg.id]);
      reset();
      toast.success('Kategori ditambahkan');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal tambah kategori')
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (catId) => api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${pkg.id}/categories/${catId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['package-categories', pkg.id]);
      toast.success('Kategori dihapus');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal hapus kategori')
  });

  const onSubmit = (data) => {
    addCategoryMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex gap-3 items-start">
        <div className="flex-1">
            <Input 
                label="Nama Kategori" 
                placeholder="Contoh: Logika Matematika" 
                {...register('name', { required: 'Wajib diisi' })} 
                className="bg-white"
            />
        </div>
        <div className="w-32">
            <Input 
                label="Passing Grade" 
                type="number" 
                placeholder="0" 
                {...register('passing_grade', { required: true, min: 0 })} 
                className="bg-white"
            />
        </div>
        <div className="mt-7">
            <Button type="submit" icon={Plus} loading={addCategoryMutation.isPending}>Tambah</Button>
        </div>
      </form>

      <div>
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Layers size={18} /> Daftar Kategori
        </h3>
        
        {isLoading ? (
            <div className="text-center py-4 text-gray-500">Memuat kategori...</div>
        ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pkgDetail?.categories?.length > 0 ? (
                    pkgDetail.categories.map((cat) => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                            <div>
                                <div className="font-semibold text-gray-800">{cat.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Passing Grade: <span className="font-mono font-bold text-blue-600">{cat.passing_grade}</span></div>
                            </div>
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                    if(confirm('Hapus kategori ini? Pastikan tidak ada soal di dalamnya.')) {
                                        deleteCategoryMutation.mutate(cat.id);
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 bg-gray-50 rounded border border-dashed text-gray-400 text-sm">
                        Belum ada kategori. Silakan tambah di atas.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function QuestionPackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  
  // State untuk Modal Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedPackageForCategory, setSelectedPackageForCategory] = useState(null);

  // --- FETCH DATA ---
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['question-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
      return res.data.data;
    },
  });

  const packages = packagesData?.data || [];

  const { data: programs } = useQuery({
    queryKey: ['common-programs'], 
    queryFn: async () => {
      const res = await api.get('/programs'); 
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  const executionMode = watch('execution_mode');

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.QUESTION_PACKAGES, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      reset();
      toast.success('Paket berhasil dibuat');
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
      toast.success('Paket diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update paket'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      toast.success('Paket dihapus');
    },
  });

  // --- HANDLERS ---
  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setValue('program_id', pkg.program_id);
      setValue('name', pkg.name);
      setValue('description', pkg.description);
      setValue('duration_minutes', pkg.duration_minutes);
      setValue('passing_score', pkg.passing_score);
      setValue('execution_mode', pkg.execution_mode || 'flexible');
      
      const attempts = (pkg.max_attempts && pkg.max_attempts > 0) ? pkg.max_attempts : 1;
      setValue('max_attempts', attempts);
      
      // [FIX] Menggunakan helper formatToWIBInput (Live) dan formatDateOnlyWIB (Flexible)
      // Ini mencegah bug tanggal mundur 1 hari saat membuka modal edit
      if (pkg.execution_mode === 'live') {
          setValue('start_date', formatToWIBInput(pkg.start_date)); 
          setValue('end_date', formatToWIBInput(pkg.end_date));
      } else {
          setValue('start_date', formatDateOnlyWIB(pkg.start_date));
          setValue('end_date', formatDateOnlyWIB(pkg.end_date));
      }

    } else {
      setEditingPackage(null);
      reset({
        duration_minutes: 120,
        passing_score: 0,
        max_attempts: 1, 
        execution_mode: 'flexible',
        start_date: '',
        end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleManageCategories = (pkg) => {
      setSelectedPackageForCategory(pkg);
      setIsCategoryModalOpen(true);
  };

  const handleDelete = (pkg) => {
    showConfirm({
      title: 'Hapus Paket',
      message: `Yakin hapus "${pkg.name}"? Semua soal dan kategori di dalamnya akan ikut terhapus.`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(pkg.id),
    });
  };

  const onSubmit = (data) => {
    if (data.start_date && data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
        return toast.error("Tanggal selesai harus setelah tanggal mulai");
    }

    const payload = { ...data };
    
    // [FIX] Sanitasi payload: Pastikan tanggal dikirim sebagai string murni
    if (payload.start_date && typeof payload.start_date === 'string') {
        // Ambil string mentah dari input (misal "2025-12-13") tanpa konversi Date
        payload.start_date = payload.start_date; 
    }
    
    if (payload.execution_mode === 'flexible') {
        if (!payload.start_date) payload.start_date = null;
        if (!payload.end_date) payload.end_date = null;
    }
    
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // --- COLUMNS ---
  const columns = [
    { 
      header: 'Nama Paket', 
      render: (row) => (
        <div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{row.name}</span>
                {row.execution_mode === 'live' && (
                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-200">LIVE</span>
                )}
            </div>
            <div className="text-xs text-gray-500">{row.program?.name}</div>
        </div>
      )
    },
    { 
        header: 'Periode Aktif (WIB)', 
        render: (row) => {
            const now = new Date();
            const start = row.start_date ? new Date(row.start_date) : null;
            const end = row.end_date ? new Date(row.end_date) : null;
            
            let statusColor = 'bg-gray-100 text-gray-600';
            let statusText = 'Selamanya';

            if (start || end) { 
                const checkEnd = end ? new Date(end) : null;
                // Jika flexible, end date dihitung sampai akhir hari
                if (checkEnd && row.execution_mode !== 'live') checkEnd.setHours(23, 59, 59);

                if ((!start || now >= start) && (!checkEnd || now <= checkEnd)) {
                    statusColor = 'bg-green-100 text-green-700';
                    statusText = 'Sedang Tayang';
                } else if (start && now < start) {
                    statusColor = 'bg-yellow-100 text-yellow-700';
                    statusText = 'Akan Datang';
                } else {
                    statusColor = 'bg-red-50 text-red-600';
                    statusText = 'Berakhir';
                }
            }

            return (
                <div className="text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold mb-1 inline-block ${statusColor}`}>{statusText}</span>
                    <div className="text-gray-500 flex items-center gap-1 mt-1 font-medium whitespace-nowrap">
                       <Calendar size={12} className="shrink-0"/> 
                       <span>{displayDateWIB(row.start_date, row.execution_mode === 'live')}</span>
                       <span className="mx-1 text-gray-300">|</span>
                       <span>{displayDateWIB(row.end_date, row.execution_mode === 'live')}</span>
                    </div>
                </div>
            );
        }
    },
    { 
        header: 'Batas', 
        render: (row) => (
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {row.max_attempts && row.max_attempts > 0 ? `${row.max_attempts}x` : '∞'}
            </span>
        ) 
    },
    { 
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" icon={Layers} onClick={() => handleManageCategories(row)} title="Kelola Kategori" className="text-purple-600 border-purple-200 hover:bg-purple-50">
            Kategori
          </Button>

          <Button size="sm" variant="outline" icon={List} onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)} title="Kelola Soal">
            Soal
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
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Bank Soal & Paket</h1>
            <p className="text-gray-500 text-sm">Kelola paket tryout, periode tayang, dan kategori penilaian.</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Paket Baru</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={packages} loading={isLoading} emptyMessage="Belum ada paket soal." />
      </div>

      {/* MODAL PAKET (Create/Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <Input label="Nama Paket" placeholder="Contoh: Tryout Akbar SKD 2025" {...register('name', { required: 'Nama wajib diisi' })} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select 
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500" 
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Durasi (Menit)" {...register('duration_minutes', { required: true, min: 1 })} />
            <Input type="number" label="Passing Grade Global" placeholder="Opsional" {...register('passing_score')} />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <Input 
                type="number" 
                label="Batas Mengerjakan (Kali)" 
                placeholder="Min. 1"
                min={1} 
                {...register('max_attempts', { 
                    required: 'Batas mengerjakan wajib diisi',
                    min: { value: 1, message: 'Minimal 1 kali pengerjaan' },
                    valueAsNumber: true
                })} 
                className="bg-white"
            />
            {errors.max_attempts && <p className="text-red-500 text-xs mt-1">{errors.max_attempts.message}</p>}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">Mode Pelaksanaan</label>
            <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer border p-3 rounded-lg flex items-center gap-3 transition-colors ${executionMode === 'flexible' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" value="flexible" {...register('execution_mode')} className="w-4 h-4 text-blue-600" />
                    <div>
                        <div className="font-bold text-gray-800 text-sm">Fleksibel</div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-1">Siswa mulai kapan saja. Timer dari 0.</div>
                    </div>
                </label>
                <label className={`cursor-pointer border p-3 rounded-lg flex items-center gap-3 transition-colors ${executionMode === 'live' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" value="live" {...register('execution_mode')} className="w-4 h-4 text-red-600" />
                    <div>
                        <div className="font-bold text-gray-800 text-sm">Live (Serentak)</div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-1">Waktu server. Telat = waktu berkurang.</div>
                    </div>
                </label>
            </div>
          </div>

          <div className={`p-4 rounded-lg border space-y-3 ${executionMode === 'live' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${executionMode === 'live' ? 'text-red-800' : 'text-blue-800'}`}>
                  {executionMode === 'live' ? <Clock size={16} /> : <Calendar size={16} />} 
                  {executionMode === 'live' ? 'Jadwal Live (Wajib Presisi Jam)' : 'Periode Ketersediaan (Opsional)'}
              </h4>
              
              {executionMode === 'live' && (
                  <p className="text-xs text-red-600 bg-white/60 p-2 rounded border border-red-100">
                      ⚠️ Mode Live menghitung sisa waktu dari <b>Jam Selesai - Jam Sekarang</b>. Pastikan tanggal & jam diisi dengan benar.
                  </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Mulai</label>
                    <input 
                        type={executionMode === 'live' ? "datetime-local" : "date"} 
                        className="w-full border rounded p-2 text-sm bg-white"
                        {...register('start_date', { required: executionMode === 'live' ? 'Wajib diisi untuk Live' : false })} 
                    />
                    {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Selesai</label>
                    <input 
                        type={executionMode === 'live' ? "datetime-local" : "date"}
                        className="w-full border rounded p-2 text-sm bg-white"
                        {...register('end_date', { required: executionMode === 'live' ? 'Wajib diisi untuk Live' : false })} 
                    />
                    {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
                </div>
              </div>
              
              {executionMode === 'flexible' && (
                  <div className="flex items-start gap-2 text-blue-600 text-xs">
                      <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                      <p>Jika dikosongkan, paket akan selalu tersedia (selamanya).</p>
                  </div>
              )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL KATEGORI (Dynamic) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedPackageForCategory ? `Kategori: ${selectedPackageForCategory.name}` : 'Manajemen Kategori'}
        size="lg"
      >
        {selectedPackageForCategory && <CategoryManager pkg={selectedPackageForCategory} />}
      </Modal>
    </div>
  );
}