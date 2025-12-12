import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowLeft, Medal, Clock, User, School } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function Ranking() {
  const { packageId } = useParams();
  const navigate = useNavigate();

  // Fetch Data Ranking
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ranking', packageId],
    queryFn: async () => {
      const res = await api.get(`/ranking/${packageId}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner text="Memuat Peringkat..." /></div>;
  if (isError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <Trophy size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Gagal memuat ranking</h2>
        <p className="text-gray-500 mb-4">Terjadi kesalahan saat mengambil data.</p>
        <Button onClick={() => navigate(-1)}>Kembali</Button>
    </div>
  );

  const { package_name, data: rankings, my_rank } = data;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500 fill-yellow-100" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400 fill-gray-100" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400 fill-orange-100" />;
    return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" className="bg-white hover:bg-gray-100 border border-gray-200 shadow-sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
                Kembali
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Trophy size={14} /> {package_name}
                </p>
            </div>
        </div>

        {/* Peringkat Saya (Sticky Card) */}
        {my_rank && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg transform transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Posisi Anda</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                        Rank #{my_rank.rank}
                    </span>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30">
                            {my_rank.rank}
                        </div>
                        <div>
                            <div className="font-bold text-xl">{my_rank.student_name}</div>
                            <div className="text-blue-200 text-sm flex items-center gap-1">
                                <School size={14} /> {my_rank.school}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-3xl font-bold">{my_rank.score}</div>
                         <div className="text-blue-200 text-sm flex items-center justify-end gap-1">
                            <Clock size={14} /> {my_rank.duration}
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Tabel Klasemen */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" /> Top 100 Siswa
                </h3>
                <span className="text-xs text-gray-400">Update Realtime</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-20 text-center">Rank</th>
                            <th className="px-6 py-4">Siswa</th>
                            <th className="px-6 py-4 text-center">Waktu</th>
                            <th className="px-6 py-4 text-right">Skor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {rankings.map((rank, idx) => (
                            <tr key={idx} className={`hover:bg-gray-50/80 transition-colors ${idx < 3 ? 'bg-yellow-50/30' : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center">{getRankIcon(rank.rank)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {rank.student_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{rank.student_name}</div>
                                            <div className="text-xs text-gray-500">{rank.school}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                        <Clock size={12} /> {rank.duration}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-blue-600 text-lg">{rank.score}</span>
                                </td>
                            </tr>
                        ))}
                        
                        {rankings.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <User size={32} className="text-gray-300" />
                                        <p>Belum ada data peringkat untuk paket soal ini.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}