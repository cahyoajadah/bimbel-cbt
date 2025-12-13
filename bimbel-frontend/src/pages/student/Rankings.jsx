import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Search, ChevronRight, Download, Clock } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints'; 
import clsx from 'clsx';
import html2pdf from 'html2pdf.js'; 
import toast from 'react-hot-toast'; 

export default function Rankings() {
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef(); 

  // Fungsi Avatar Inisial (untuk stabilitas PDF)
  const AvatarInitial = ({ name, className }) => {
      const initials = name 
        ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
        : 'S';
      
      const colors = [
          'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 
          'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700',
          'bg-indigo-100 text-indigo-700'
      ];
      const colorClass = colors[name.length % colors.length];

      return (
          <div className={clsx("flex items-center justify-center rounded-full font-bold text-xs border border-white/50 shadow-sm", colorClass, className)}>
              {initials}
          </div>
      );
  };
  
  // Helper: Format Durasi (dari detik ke m dan s)
  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };
  
  // Fungsi Direct Download PDF (Optimized for stability)
  const handleDownloadPDF = () => {
      setIsDownloading(true);
      const element = printRef.current;
      
      const opt = {
        margin:       10, 
        filename:     `Peringkat-Tryout-${selectedPackageId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true, 
            foreignObjectRendering: true,
            ignoreElements: (node) => node.classList && node.classList.contains('hide-on-print')
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all'] } 
      };

      html2pdf().set(opt).from(element).save().then(() => {
          setIsDownloading(false);
          toast.success("PDF berhasil diunduh.");
      }).catch((err) => {
          console.error("Gagal download PDF:", err);
          setIsDownloading(false);
          toast.error("Gagal membuat PDF.");
      });
  };

  // 1. Fetch Daftar Paket
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['ranking-packages'],
    queryFn: async () => {
      const url = API_ENDPOINTS.STUDENT_RANKING_PACKAGES || '/student/rankings/packages';
      const res = await api.get(url);
      return res.data.data;
    },
  });

  // 2. Fetch Data Ranking Detail
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
  
  // Set paket pertama sebagai default yang dipilih
  useEffect(() => {
    if (packagesData?.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packagesData[0].id);
    }
  }, [packagesData, selectedPackageId]);


  const packages = packagesData || [];
  const rankings = rankingData?.rankings || [];
  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);


  // Render Medal Icon di Tabel
  const renderMedal = (rank) => {
    if (rank === 1) return <Medal className="inline text-yellow-500" fill="currentColor" size={20} />;
    if (rank === 2) return <Medal className="inline text-gray-400" fill="currentColor" size={20} />;
    if (rank === 3) return <Medal className="inline text-orange-400" fill="currentColor" size={20} />;
    return <span className="font-bold text-gray-500">{rank}</span>;
  };

  // Helper untuk menentukan status Lulus/Tidak Lulus
  const isStudentPassed = (student) => {
    return (student.score || 0) > 0; 
  };
  
  // Helper untuk mendapatkan nama paket
  const getPackageName = () => {
      return selectedPackage?.name || 'Papan Peringkat';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Statis */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Papan Peringkat (Leaderboard)</h1>
            <p className="text-gray-600">Lihat posisimu dibandingkan siswa lainnya.</p>
          </div>
        </div>

        {/* [NEW LAYOUT] Sidebar dan Main Content dipisah untuk UI */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar: Daftar Paket (TETAP TAMPIL DI LAYAR) */}
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
                        <div className="text-xs text-gray-500 mt-0.5">{pkg.program?.name || 'Umum'}</div>
                      </div>
                      {selectedPackageId === pkg.id && <ChevronRight size={16} className="text-blue-600"/>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Tabel Ranking (Fokus Utama) */}
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
              // [AREA PRINT/DOWNLOAD] DIBUNGKUS OLEH printRef
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Header Konten (Visible di Layar + Tombol Download) */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white hide-on-print">
                    <div>
                        <h2 className="text-lg font-bold">{getPackageName()}</h2>
                        <p className="text-blue-100 text-sm">Total Peserta: {rankings.length} Siswa</p>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-yellow-400 text-blue-900 transition-colors hover:bg-yellow-300",
                            isDownloading ? 'opacity-70 cursor-not-allowed' : ''
                        )}
                    >
                        <Download size={16} /> {isDownloading ? 'Memproses...' : 'Download PDF'}
                    </button>
                </div>
                
                {/* [KONTEN CETAK] Pindahkan konten cetak ke div yang direferensikan */}
                <div ref={printRef} className="pdf-content p-0"> 
                    
                    {/* PDF HEADER (Hanya Tampil di PDF) */}
                    <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white pdf-header">
                        <div>
                            <h2 className="text-lg font-bold">{getPackageName()}</h2>
                            <p className="text-blue-100 text-sm">Total Peserta: {rankings.length} Siswa</p>
                        </div>
                        <Trophy size={40} className="text-yellow-300 opacity-80" />
                    </div>

                    {rankings.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">Belum ada data ranking untuk paket ini.</div>
                    ) : (
                        <table className="w-full pdf-table-fixed">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
                            <th className="px-6 py-4 w-12 text-center">#</th> 
                            <th className="px-6 py-4 w-[45%]">Nama Siswa</th>
                            <th className="px-6 py-4 text-center w-[15%]">Waktu</th>
                            <th className="px-6 py-4 text-center w-[15%]">Total Skor</th>
                            <th className="px-6 py-4 text-center w-[10%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rankings.map((student) => (
                            <tr 
                                key={student.rank} 
                                className={clsx(
                                "transition-colors hover:bg-gray-50 pdf-row break-inside-avoid",
                                student.is_me ? "bg-yellow-50 hover:bg-yellow-100 ring-1 ring-yellow-200" : ""
                                )}
                            >
                                <td className="px-6 py-4 text-center">
                                {renderMedal(student.rank)}
                                </td>
                                <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                    <AvatarInitial name={student.student_name} className="w-6 h-6 text-[10px] shrink-0" />
                                    <span className="pdf-name">{student.student_name}</span>
                                    {student.is_me && <span className="bg-yellow-200 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full">Anda</span>}
                                </div>
                                </td>
                                
                                <td className="px-6 py-4 text-center font-mono text-gray-600 pdf-score">
                                    <span className='flex items-center justify-center gap-1'>
                                    <Clock size={12} className='text-gray-400'/> {formatDuration(student.duration)}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-center">
                                <span className="text-lg font-bold text-blue-600 pdf-score">{student.score || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                {isStudentPassed(student) ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 pdf-status">
                                        Lulus
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 pdf-status">
                                        Tidak
                                    </span>
                                )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
    {/* CSS untuk Stabilitas PDF dan Layout */}
    <style>{`
        /* [GLOBAL PDF FIXES] */
        .pdf-content * {
            font-family: Arial, sans-serif !important; 
            word-break: break-word !important;
            word-wrap: break-word !important;
        }
        /* [CRITICAL FIX] Memastikan konten terlihat */
        .pdf-content {
            display: block !important;
            min-height: 100px;
        }

        /* [NEW FIX] Aturan CSS untuk Tabel */
        .pdf-table-fixed {
            table-layout: fixed !important; /* Kunci stabilitas di html2canvas */
        }

        /* [FONT NAME FIX] Mencegah pemotongan horizontal dan line-clamp */
        .pdf-name {
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
            line-height: 1.2 !important;
            max-width: 100% !important;
        }
        
        .pdf-score {
            font-size: 14px !important; 
            font-weight: bold !important;
        }
        .pdf-small-text {
             font-size: 10px !important;
        }

        /* [PAGE BREAK FIX] */
        .pdf-row, .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }

        /* [VISIBILITY CONTROL - PENTING] */
        
        .pdf-header {
             /* Hanya muncul di PDF */
             display: none !important;
             visibility: hidden !important;
        }

        @media screen {
            /* Pastikan elemen interaktif terlihat di layar */
            .hide-on-print {
                display: flex !important; 
                visibility: visible !important;
            }
        }
        
        @media print {
            /* Sembunyikan elemen interaktif di PDF */
            .hide-on-print {
                display: none !important;
                visibility: hidden !important;
            }
            /* Tampilkan Header PDF */
            .pdf-header {
                display: flex !important;
                visibility: visible !important;
            }
            
            /* Sembunyikan elemen dashboard utama (asumsi ini di luar komponen ini) */
            .app-main-header, 
            .app-sidebar, 
            .dashboard-layout > header,
            .dashboard-layout > aside,
            .app-layout > header,
            .app-layout > aside
            {
                display: none !important;
                visibility: hidden !important;
            }
        }
      `}</style>
    </div>
  );
}