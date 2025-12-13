import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, RotateCw, AlertTriangle, Calendar, Layers } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useState } from 'react';
import toast from 'react-hot-toast';

// [HELPER] Format Tanggal WIB
const formatDateTime = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

export default function Tryouts() {
  const navigate = useNavigate();
  const [selectedTryout, setSelectedTryout] = useState(null);

  const { data: tryouts, isLoading, refetch } = useQuery({
    queryKey: ['available-tryouts'],
    queryFn: async () => {
      const res = await api.get('/student/tryouts');
      return res.data.data;
    },
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.post(`/cbt/start/${id}`),
    onSuccess: (res) => {
      // Struktur: res.data (axios) -> data (laravel response) -> session_token
      const token = res.data?.data?.session_token;

      if (token) {
        // 2. Simpan Token
        localStorage.setItem('cbt_token', token);

        toast.success("Ujian dimulai! Mengalihkan...");

        // 3. BERI JEDA 500ms (PENTING)
        // Agar LocalStorage sempat menulis data sebelum halaman CBT membacanya
        setTimeout(() => {
             navigate('/student/cbt');
        }, 500);
      } else {
        console.error("DEBUG: Token TIDAK ditemukan di respon API");
        toast.error("Gagal memulai: Token sesi hilang.");
      }
    },
    onError: (err) => {
        console.error("DEBUG: Error Start:", err);
        toast.error(err.response?.data?.message || 'Gagal memulai ujian');
    }
  });

  const handleStart = (tryout) => {
    if (tryout.is_limit_reached) return;
    
    // Jika mode live, cek tanggal lagi di frontend (UX only)
    if (tryout.execution_mode === 'live') {
        const now = new Date();
        const start = tryout.start_date ? new Date(tryout.start_date) : null;
        if (start && now < start) {
            return toast.error("Ujian belum dimulai");
        }
    }
    
    setSelectedTryout(tryout);
  };

  const confirmStart = () => {
    if (selectedTryout) {
        startMutation.mutate(selectedTryout.id);
        setSelectedTryout(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat ujian...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tryout Tersedia</h1>
        <p className="text-gray-500 text-sm">Pilih paket tryout yang ingin Anda kerjakan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tryouts?.map((tryout) => (
          <div key={tryout.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all relative group">
            
            {/* BADGE LIVE */}
            {tryout.execution_mode === 'live' && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE EVENT
                </div>
            )}

            <div className="p-5">
                {/* [FIX] Akses Program Name dengan Optional Chaining (?.name) */}
                <div className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">
                    {tryout.program?.name || 'Program Umum'}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tryout.name}
                </h3>

                {/* [FIX] Tampilkan Kategori jika ada */}
                {tryout.categories && tryout.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {tryout.categories.slice(0, 3).map((cat, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                {cat}
                            </span>
                        ))}
                        {tryout.categories.length > 3 && <span className="text-[10px] text-gray-400">+{tryout.categories.length - 3}</span>}
                    </div>
                )}

                <div className="space-y-2 text-sm text-gray-600 mt-4">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{tryout.duration_minutes} Menit</span>
                    </div>
                    
                    {/* Tampilkan Jadwal jika Live */}
                    {tryout.execution_mode === 'live' && tryout.start_date && (
                        <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded text-xs font-medium">
                            <Calendar size={14} className="mt-0.5 shrink-0" />
                            <div>
                                <div>{formatDateTime(tryout.start_date)}</div>
                                <div className="text-red-400">s/d {formatDateTime(tryout.end_date)}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <RotateCw size={16} className="text-gray-400" />
                        <span>Kesempatan: 
                            <span className={tryout.is_limit_reached ? "text-red-600 font-bold ml-1" : "text-gray-900 font-medium ml-1"}>
                                {tryout.user_attempts_count} / {tryout.max_attempts ?? '∞'}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Button 
                    className="w-full justify-center"
                    icon={tryout.has_ongoing_session ? Play : (tryout.is_limit_reached ? CheckCircle : Play)}
                    variant={tryout.has_ongoing_session ? 'warning' : (tryout.is_limit_reached ? 'outline' : 'primary')}
                    onClick={() => handleStart(tryout)}
                    disabled={tryout.is_limit_reached && !tryout.has_ongoing_session}
                >
                    {tryout.has_ongoing_session ? 'Lanjutkan' : (tryout.is_limit_reached ? 'Selesai' : 'Mulai Tryout')}
                </Button>
            </div>
          </div>
        ))}

        {(!tryouts || tryouts.length === 0) && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed text-gray-500">
                Belum ada paket tryout yang tersedia saat ini.
            </div>
        )}
      </div>

      {/* MODAL KONFIRMASI */}
      <Modal isOpen={!!selectedTryout} onClose={() => setSelectedTryout(null)} title="Konfirmasi Mulai" size="sm">
        <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-3">
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                    <p className="font-bold">Perhatikan!</p>
                    <p>Waktu akan berjalan segera setelah Anda menekan tombol mulai.</p>
                    {selectedTryout?.execution_mode === 'live' && (
                        <p className="mt-2 text-red-700 font-bold">⚠️ Ini adalah Ujian LIVE. Waktu mengacu pada server. Keterlambatan akan mengurangi durasi pengerjaan Anda.</p>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedTryout(null)}>Batal</Button>
                <Button onClick={confirmStart} loading={startMutation.isPending}>Mulai Sekarang</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}