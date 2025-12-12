import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, TrendingUp, Clock, Calendar, CheckCircle, XCircle, Eye, BarChart2, List } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal'; // Pastikan komponen Modal sudah ada
import { useNavigate } from 'react-router-dom';

export default function Progress() {
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Data Progress
  const { data: progressData, isLoading, isError } = useQuery({
    queryKey: ['student-progress'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PROGRESS);
      return res.data.data;
    },
  });

  const handleShowDetails = (result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Gagal memuat data progress. Pastikan koneksi server aman.</p>
      </div>
    );
  }

  const { summary, history } = progressData || {};

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Perkembangan Belajar</h1>
        <p className="text-gray-600 mt-1">Pantau statistik dan riwayat hasil tryout Anda.</p>
      </div>

      {/* Kartu Statistik Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-[1.01]">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Award size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Nilai</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary?.average_score || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-[1.01]">
          <div className="p-4 bg-green-50 text-green-600 rounded-full">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tryout Selesai</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary?.completed_tryouts || 0}</h3>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Riwayat Tryout Terakhir</h3>
          <span className="text-xs font-medium px-2 py-1 bg-white border rounded text-gray-500">
            {history?.length || 0} Data Ditampilkan
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">Nama Paket Soal</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Skor</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {history?.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.package_name || "Paket Tanpa Nama"}
                      <div className="text-xs text-gray-500 mt-0.5">{item.program_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.is_passed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle size={12} /> Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                          <XCircle size={12} /> Tidak Lulus
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-800">{item.score}</span>
                      <span className="text-xs text-gray-400 ml-1">/ {item.max_score}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            {/* Tombol Detail Nilai */}
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-gray-600 hover:bg-gray-100"
                                onClick={() => handleShowDetails(item)} 
                                title="Detail Nilai per Kategori"
                            >
                                <List size={18} />
                            </Button>
                            
                            {/* Tombol Ranking */}
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-purple-600 hover:bg-purple-50"
                                onClick={() => navigate(`/student/ranking/${item.package_id}`)} 
                                title="Lihat Peringkat"
                            >
                                <BarChart2 size={18} />
                            </Button>

                            {/* Tombol Pembahasan */}
                            <Button 
                                size="sm" variant="ghost" 
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => navigate(`/student/tryout-review/${item.id}`)}
                                title="Lihat Pembahasan"
                            >
                                <Eye size={18} />
                            </Button>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Clock size={32} />
                      </div>
                      <p className="font-medium">Belum ada riwayat tryout.</p>
                      <p className="text-sm mt-1">Selesaikan tryout pertama Anda untuk melihat statistik di sini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Nilai Kategori */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Rincian Nilai" size="md">
        {selectedResult && (
            <div className="space-y-5">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="font-semibold text-gray-700">Total Skor Akhir</span>
                    <div className="text-right">
                        <span className="font-bold text-2xl text-blue-600">{selectedResult.score}</span>
                        <span className="text-sm text-gray-400 font-medium"> / {selectedResult.max_score}</span>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                        <List size={16} /> Nilai Per Kategori
                    </h4>
                    <div className="space-y-3">
                        {selectedResult.category_scores && selectedResult.category_scores.length > 0 ? (
                            selectedResult.category_scores.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-bold text-gray-800">{cat.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Passing Grade: <span className="font-medium">{cat.passing_grade}</span></div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${cat.passed ? 'text-green-600' : 'text-red-500'}`}>
                                            {cat.score_obtained}
                                        </div>
                                        <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${cat.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {cat.passed ? 'Lulus' : 'Gagal'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm">Tidak ada data kategori untuk paket soal ini.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button onClick={() => setIsModalOpen(false)}>Tutup</Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}