import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, TrendingUp, ArrowRight, Award, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCBTStore } from '../../store/cbtStore';
import toast from 'react-hot-toast';

export default function Tryouts() {
  const navigate = useNavigate();
  const { initSession } = useCBTStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['student-tryouts'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.TRYOUTS);
      return res.data.data;
    },
    refetchOnMount: 'always',
  });

  const tryoutPackages = data || [];

  const startSessionMutation = useMutation({
    mutationFn: async (packageId) => {
      const res = await api.post(API_ENDPOINTS.TRYOUT_START(packageId));
      return res.data.data;
    },
    onSuccess: (sessionData) => {
      api.get(API_ENDPOINTS.CBT_QUESTIONS, {
        headers: { 'X-CBT-Session-Token': sessionData.session_token }
      }).then(res => {
        initSession(sessionData, res.data.data);
        if(sessionData.is_resumed) {
            toast('Melanjutkan sesi sebelumnya...', { icon: '🔄' });
        } else {
            toast.success(`Sesi tryout ${sessionData.package.name} dimulai!`);
        }
        navigate(`/student/cbt/${sessionData.session_id}`);
      }).catch(err => {
        toast.error('Gagal memuat soal. Silakan coba lagi.');
        useCBTStore.getState().resetSession();
        console.error(err);
      });
    },
    onError: (error) => {
      if (error.response?.status === 409) {
         toast.error("Anda memiliki sesi ujian lain yang belum selesai.", { duration: 4000 });
         // Opsional: Refresh list agar status terupdate jika backend melakukan auto-cleanup
         refetch();
      } else {
         toast.error(error.response?.data?.message || 'Gagal memulai sesi tryout');
      }
    },
  });

  const handleStartTryout = (packageId) => {
    startSessionMutation.mutate(packageId);
  };

  if (isLoading) {
    return <LoadingSpinner text="Memuat daftar tryout..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tryout Tersedia</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pilih paket tryout yang ingin Anda kerjakan.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate('/student/progress')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Lihat Riwayat & Progres
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tryoutPackages.map((pkg) => {
          // [UPDATED] Mengambil nilai langsung dari backend yang sudah di-fix
          const maxAttempts = pkg.max_attempts; 
          const userAttempts = pkg.user_attempts_count || 0;
          // Gunakan flag dari backend jika tersedia, atau hitung manual
          const canAttempt = pkg.can_attempt !== undefined ? pkg.can_attempt : (userAttempts < maxAttempts);

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow p-6 border-t-4 space-y-4 ${
                !canAttempt ? 'border-gray-400 opacity-80' : 'border-blue-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className={`w-6 h-6 ${!canAttempt ? 'text-gray-400' : 'text-blue-600'}`} />
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3">{pkg.description || 'Tidak ada deskripsi.'}</p>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Durasi: {pkg.duration_minutes} menit</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span>Total Soal: {pkg.total_questions}</span>
                </div>
                {pkg.passing_score > 0 && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Award className="w-4 h-4 mr-2 text-yellow-500" />
                    <span className="font-medium">Passing Score: {pkg.passing_score}</span>
                  </div>
                )}

                {/* [FIX] Menghapus kondisi "Bisa dikerjakan berulang" dan selalu menampilkan kuota */}
                <div className={`flex items-center text-sm font-medium mt-2 p-2 rounded ${
                    !canAttempt ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                    {!canAttempt ? <AlertCircle className="w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                    <span>
                        Kesempatan: <strong>{userAttempts}</strong> / {maxAttempts} kali
                    </span>
                </div>
              </div>
              
              <Button
                onClick={() => handleStartTryout(pkg.id)}
                loading={startSessionMutation.isPending}
                className="w-full"
                disabled={!canAttempt || startSessionMutation.isPending}
                variant={!canAttempt ? "secondary" : "primary"}
                icon={!canAttempt ? null : ArrowRight}
              >
                {startSessionMutation.isPending 
                    ? 'Memulai Sesi...' 
                    : !canAttempt 
                        ? 'Kesempatan Habis' 
                        : 'Mulai Tryout'
                }
              </Button>
            </div>
          );
        })}
      </div>

      {tryoutPackages.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada paket tryout yang tersedia.</p>
        </div>
      )}
    </div>
  );
}