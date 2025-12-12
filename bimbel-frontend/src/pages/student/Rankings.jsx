import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Search, ChevronRight } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import clsx from 'clsx';

export default function Rankings() {
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  // 1. Fetch Daftar Paket yang sudah dikerjakan
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['ranking-packages'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.STUDENT_RANKING_PACKAGES);
      return res.data.data;
    },
  });

  // 2. Fetch Data Ranking Detail saat paket dipilih
  const { data: rankingData, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['ranking-detail', selectedPackageId],
    queryFn: async () => {
      if (!selectedPackageId) return null;
      const res = await api.get(API_ENDPOINTS.STUDENT_RANKING_DETAIL(selectedPackageId));
      return res.data.data;
    },
    enabled: !!selectedPackageId,
  });

  const packages = packagesData || [];
  const rankings = rankingData?.rankings || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Papan Peringkat (Leaderboard)</h1>
            <p className="text-gray-600">Lihat posisimu dibandingkan siswa lainnya.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar: Daftar Paket */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
                Pilih Paket Tryout
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {isLoadingPackages ? (
                  <div className="p-4 text-center text-gray-400">Memuat...</div>
                ) : packages.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Belum ada tryout yang dikerjakan.</div>
                ) : (
                  packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={clsx(
                        "w-full text-left p-4 border-b last:border-b-0 hover:bg-blue-50 transition-colors flex justify-between items-center",
                        selectedPackageId === pkg.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                      )}
                    >
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{pkg.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{pkg.program?.name}</div>
                      </div>
                      {selectedPackageId === pkg.id && <ChevronRight size={16} className="text-blue-600"/>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Tabel Ranking */}
          <div className="lg:col-span-3">
            {!selectedPackageId ? (
              <div className="h-96 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p>Pilih paket tryout di sebelah kiri untuk melihat ranking.</p>
              </div>
            ) : isLoadingRankings ? (
              <div className="h-96 flex items-center justify-center bg-white rounded-xl">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div>
                        <h2 className="text-lg font-bold">{rankingData?.package_name}</h2>
                        <p className="text-blue-100 text-sm">Total Peserta: {rankings.length} Siswa</p>
                    </div>
                    <Trophy size={40} className="text-yellow-300 opacity-80" />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
                        <th className="px-6 py-4 w-16 text-center">#</th>
                        <th className="px-6 py-4">Nama Siswa</th>
                        <th className="px-6 py-4 text-center">TWK</th>
                        <th className="px-6 py-4 text-center">TIU</th>
                        <th className="px-6 py-4 text-center">TKP</th>
                        <th className="px-6 py-4 text-center">Total Skor</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rankings.map((student) => (
                        <tr 
                          key={student.rank} 
                          className={clsx(
                            "transition-colors hover:bg-gray-50",
                            student.is_me ? "bg-yellow-50 hover:bg-yellow-100 ring-1 ring-yellow-200" : ""
                          )}
                        >
                          <td className="px-6 py-4 text-center">
                            {student.rank === 1 ? <Medal className="inline text-yellow-500" fill="currentColor" /> : 
                             student.rank === 2 ? <Medal className="inline text-gray-400" fill="currentColor" /> :
                             student.rank === 3 ? <Medal className="inline text-orange-400" fill="currentColor" /> :
                             <span className="font-bold text-gray-500">{student.rank}</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {student.student_name}
                                {student.is_me && <span className="bg-yellow-200 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full">Anda</span>}
                            </div>
                            <div className="text-xs text-gray-400">{student.date}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-gray-600">{student.score_twk}</td>
                          <td className="px-6 py-4 text-center font-mono text-gray-600">{student.score_tiu}</td>
                          <td className="px-6 py-4 text-center font-mono text-gray-600">{student.score_tkp}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-bold text-blue-600">{student.total_score}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {student.is_passed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Lulus
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Tidak
                                </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}