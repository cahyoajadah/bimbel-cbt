import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Search, ChevronRight, Download, Clock, User, Calendar } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints'; 
import clsx from 'clsx';
import html2pdf from 'html2pdf.js'; 
import toast from 'react-hot-toast'; 

export default function Rankings() {
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // State untuk mode PDF (mengubah tampilan layar menjadi format cetak saat download)
  const [isPdfMode, setIsPdfMode] = useState(false);
  
  const printRef = useRef(); 

  // --- HELPER FUNCTIONS ---

  const AvatarInitial = ({ name, className }) => {
      const initials = name 
        ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
        : 'S';
      
      const colors = [
          'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 
          'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700',
          'bg-indigo-100 text-indigo-700'
      ];
      const charCode = name ? name.charCodeAt(0) : 0;
      const colorClass = colors[charCode % colors.length];

      return (
          <div className={clsx("flex items-center justify-center rounded-full font-bold border border-white/50 shadow-sm", colorClass, className)}>
              {initials}
          </div>
      );
  };
  
  // [FIX WAKTU] Format durasi dengan Math.abs untuk menangani nilai negatif dari backend
  const formatDuration = (val) => {
    const rawSeconds = parseInt(val);
    if (isNaN(rawSeconds)) return '-'; // Jika data null/invalid

    // Ambil nilai absolut (misal backend kirim -90 detik, kita anggap 90 detik)
    const seconds = Math.abs(rawSeconds);
    
    if (seconds === 0) return '0s'; // Jika tepat 0

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    
    // Logika tampilan yang lebih natural
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  };
  
  // --- DATA FETCHING ---

  const { data: packagesData, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['ranking-packages'],
    queryFn: async () => {
      const url = API_ENDPOINTS.STUDENT_RANKING_PACKAGES || '/student/rankings/packages';
      const res = await api.get(url);
      return res.data.data;
    },
  });

  const { data: rankingData, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['ranking-detail', selectedPackageId],
    queryFn: async () => {
      if (!selectedPackageId) return null;
      const url = API_ENDPOINTS.STUDENT_RANKING_DETAIL ? API_ENDPOINTS.STUDENT_RANKING_DETAIL(selectedPackageId) : `/student/rankings/${selectedPackageId}`;
      const res = await api.get(url);
      return res.data.data;
    },
    enabled: !!selectedPackageId,
  });
  
  useEffect(() => {
    if (packagesData?.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packagesData[0].id);
    }
  }, [packagesData, selectedPackageId]);

  const packages = packagesData || [];
  const rankings = rankingData?.rankings || [];
  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);

  // --- PDF GENERATION ---

  const handleDownloadPDF = () => {
      if (isDownloading) return;
      setIsDownloading(true);
      
      // 1. Ubah tampilan ke Mode PDF (Sembunyikan sidebar, ubah header jadi putih)
      setIsPdfMode(true); 
      window.scrollTo(0, 0);

      // 2. Beri jeda agar React selesai me-render tampilan PDF
      setTimeout(() => {
          const element = printRef.current;
          
          const opt = {
            margin:       [10, 10, 10, 10], 
            filename:     `Ranking-${selectedPackage?.name || 'Tryout'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                scrollY: 0,
                logging: false,
                ignoreElements: (node) => node.classList && node.classList.contains('no-print')
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
          };

          html2pdf().set(opt).from(element).save()
            .then(() => {
                setIsPdfMode(false); // Kembalikan ke tampilan normal
                setIsDownloading(false);
                toast.success("PDF berhasil diunduh");
            })
            .catch((err) => {
                console.error("PDF Error:", err);
                setIsPdfMode(false);
                setIsDownloading(false);
                toast.error("Gagal membuat PDF");
            });
      }, 800); 
  };

  // --- RENDER HELPERS ---

  const renderMedal = (rank) => {
    if (rank === 1) return <div className="flex justify-center"><Medal className="text-yellow-500 drop-shadow-sm" fill="#eab308" size={24} /></div>;
    if (rank === 2) return <div className="flex justify-center"><Medal className="text-gray-400 drop-shadow-sm" fill="#9ca3af" size={24} /></div>;
    if (rank === 3) return <div className="flex justify-center"><Medal className="text-orange-400 drop-shadow-sm" fill="#fb923c" size={24} /></div>;
    return <span className="font-bold text-gray-500 text-lg">#{rank}</span>;
  };

  return (
    <div className={clsx("min-h-screen bg-gray-50 font-sans transition-all", isPdfMode ? "p-0 bg-white" : "p-4 md:p-8")}>
      <div className={clsx("mx-auto", isPdfMode ? "max-w-none w-full" : "max-w-7xl")}>
        
        {/* === HEADER HALAMAN (Hilang saat mode PDF aktif) === */}
        {!isPdfMode && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl text-yellow-600">
                        <Trophy size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Papan Peringkat</h1>
                        <p className="text-gray-500 text-sm">Lihat posisi dan skor tryout kamu.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* === SIDEBAR (Hilang saat mode PDF aktif) === */}
          {!isPdfMode && (
            <div className="lg:w-1/4 flex-shrink-0 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">Pilih Paket</span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{packages.length}</span>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        {isLoadingPackages ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Memuat paket...</div>
                        ) : packages.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Belum ada riwayat tryout.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={clsx(
                                            "w-full text-left p-4 hover:bg-gray-50 transition-all group relative",
                                            selectedPackageId === pkg.id ? "bg-blue-50/60" : ""
                                        )}
                                    >
                                        {selectedPackageId === pkg.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                                        )}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={clsx("font-semibold text-sm", selectedPackageId === pkg.id ? "text-blue-700" : "text-gray-700")}>
                                                {pkg.name}
                                            </span>
                                            {selectedPackageId === pkg.id && <ChevronRight size={14} className="text-blue-600" />}
                                        </div>
                                        <div className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                                            {pkg.program?.name || 'Program Umum'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* === MAIN CONTENT === */}
          <div className={clsx("flex-1 min-w-0", isPdfMode ? "w-full" : "lg:w-3/4")}>
            {!selectedPackageId ? (
              <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Search size={32} className="opacity-50" />
                </div>
                <p className="font-medium">Pilih paket tryout di sebelah kiri.</p>
              </div>
            ) : isLoadingRankings ? (
              <div className="h-96 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
                 <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Memuat data peringkat...</span>
                 </div>
               </div>
            ) : (
              // === AREA YANG AKAN DICETAK (printRef) ===
              <div ref={printRef} className={clsx("bg-white overflow-hidden", isPdfMode ? "" : "rounded-2xl shadow-sm border border-gray-200")}>
                
                {/* HEADER KONTEN (Biru di Layar, Putih di PDF) */}
                <div className={clsx(
                    "p-6 flex justify-between items-center border-b", 
                    isPdfMode ? "border-gray-800 mb-4 bg-white text-gray-900" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" // [FIX] Header Biru/Indigo
                )}>
                    <div>
                        <h2 className={clsx("font-bold tracking-tight", isPdfMode ? "text-3xl uppercase" : "text-lg")}>
                            {selectedPackage?.name || 'Hasil Ranking'}
                        </h2>
                        <div className={clsx("flex items-center gap-2 mt-1", isPdfMode ? "text-gray-500" : "text-blue-100")}>
                            <User size={14} />
                            <span className="text-sm font-medium">{rankings.length} Peserta</span>
                            {isPdfMode && (
                                <>
                                    <span className="mx-2">•</span>
                                    <Calendar size={14} />
                                    <span className="text-sm">Cetak: {new Date().toLocaleDateString('id-ID')}</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Tombol Download (Hanya di Layar) */}
                    {!isPdfMode ? (
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95",
                                "bg-white text-blue-900 hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed"
                            )}
                        >
                            {isDownloading ? (
                                <><div className="animate-spin h-4 w-4 border-2 border-blue-900 border-t-transparent rounded-full"/> Proses...</>
                            ) : (
                                <><Download size={16} /> Download PDF</>
                            )}
                        </button>
                    ) : (
                        // Icon saat PDF
                        <div className="p-2 border-2 border-yellow-500 rounded-full">
                            <Trophy size={32} className="text-yellow-600" />
                        </div>
                    )}
                </div>
                
                {/* KONTEN TABEL */}
                <div className={clsx(isPdfMode ? "p-4" : "overflow-x-auto")}>
                  {rankings.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-block p-4 bg-gray-50 rounded-full mb-3">
                            <Trophy size={40} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada data peringkat untuk paket ini.</p>
                    </div>
                  ) : (
                    <table className={clsx("w-full text-left border-collapse", isPdfMode && "pdf-table")}>
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-6 py-4 bg-gray-50/50 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider w-20">Peringkat</th>
                          <th className="px-6 py-4 bg-gray-50/50 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Siswa</th>
                          <th className="px-6 py-4 bg-gray-50/50 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider w-32">Waktu</th>
                          <th className="px-6 py-4 bg-gray-50/50 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider w-32">Skor Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rankings.map((student) => (
                          <tr 
                            key={student.rank} 
                            className={clsx(
                              "group transition-colors pdf-row",
                              !isPdfMode && "hover:bg-gray-50",
                              student.is_me ? "bg-blue-50/60" : ""
                            )}
                          >
                            <td className="px-6 py-4 text-center align-middle">
                              {renderMedal(student.rank)}
                            </td>
                            
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                  <AvatarInitial name={student.student_name} className="w-9 h-9 text-xs shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                      <span className={clsx("font-bold truncate max-w-[200px] md:max-w-xs pdf-name", student.is_me ? "text-blue-700" : "text-gray-900")}>
                                          {student.student_name}
                                      </span>
                                      {student.is_me && (
                                          <span className="inline-flex mt-0.5 items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 leading-none">
                                              KAMU
                                          </span>
                                      )}
                                  </div>
                              </div>
                            </td>
                            
                            {/* [FIX WAKTU] Menampilkan durasi yang sudah diperbaiki */}
                            <td className="px-6 py-4 text-center align-middle">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-mono font-bold">
                                  <Clock size={12} className="text-gray-500" />
                                  {formatDuration(student.duration)}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-center align-middle">
                              <span className={clsx("text-lg font-black tracking-tight", student.is_me ? "text-blue-600" : "text-gray-900")}>
                                {student.score || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                {/* FOOTER PDF */}
                {isPdfMode && (
                    <div className="mt-8 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                        Dicetak otomatis oleh Sistem CBT National Academy
                    </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

        .pdf-table { table-layout: fixed; width: 100%; }
        .pdf-name { white-space: normal !important; word-wrap: break-word !important; overflow: visible !important; }
        .pdf-row { page-break-inside: avoid; }
        
        @media print {
            .no-print, header, aside, .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}