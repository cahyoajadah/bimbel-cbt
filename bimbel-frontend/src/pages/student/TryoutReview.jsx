import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import html2pdf from 'html2pdf.js'; // [UBAH] Gunakan html2pdf
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { CheckCircle, XCircle, ArrowLeft, Clock, Award, CheckSquare, Square, AlertTriangle, Info, Flag, MessageSquare, Download } from 'lucide-react'; // [UBAH] Icon Download
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import 'katex/dist/katex.min.css'; 
import 'react-quill/dist/quill.snow.css'; 

export default function TryoutReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [reportContent, setReportContent] = useState('');
  
  // [BARU] State loading untuk proses download
  const [isDownloading, setIsDownloading] = useState(false);

  // [BARU] Fungsi Direct Download PDF
  const handleDownloadPDF = () => {
      setIsDownloading(true);
      const element = componentRef.current;
      
      const opt = {
        margin:       [10, 10, 10, 10], // Margin (mm)
        filename:     `Pembahasan-Tryout-${resultId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, // Resolusi tinggi agar teks/rumus tajam
            useCORS: true, // Izinkan gambar cross-origin
            // [PENTING] Sembunyikan elemen yang punya class 'print:hidden'
            ignoreElements: (node) => node.classList && node.classList.contains('print:hidden')
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // Mencegah soal terpotong
      };

      html2pdf().set(opt).from(element).save().then(() => {
          setIsDownloading(false);
          toast.success("Pembahasan berhasil diunduh");
      }).catch((err) => {
          console.error("Download error:", err);
          setIsDownloading(false);
          toast.error("Gagal mengunduh PDF");
      });
  };

  const { data: reviewData, isLoading, error } = useQuery({
    queryKey: ['tryout-review', resultId],
    queryFn: async () => {
      const res = await api.get(`/student/tryout-results/${resultId}`);
      return res.data.data;
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post(API_ENDPOINTS.REPORT_QUESTION, data);
    },
    onSuccess: () => {
      toast.success('Laporan berhasil dikirim');
      handleCloseReportModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim laporan')
  });

  const handleOpenReportModal = (questionId) => {
      setSelectedQuestionId(questionId);
      setReportContent('');
      setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
      setIsReportModalOpen(false);
      setSelectedQuestionId(null);
      setReportContent('');
  };

  const submitReport = () => {
      if (!reportContent.trim()) return toast.error('Isi laporan tidak boleh kosong');
      reportMutation.mutate({ question_id: selectedQuestionId, report_content: reportContent });
  };

  const formatScore = (val) => {
      const num = parseFloat(val || 0);
      return num % 1 === 0 ? num : num.toFixed(2);
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error || !reviewData) return <div className="p-10 text-center">Gagal memuat data.</div>;

  const { score, correct_answers_count, total_questions, duration_taken, questions } = reviewData;
  const wrongOrPartialCount = total_questions - correct_answers_count;

  const renderAnswerReview = (q) => {
    // 1. ISIAN SINGKAT
    if (q.type === 'short') {
        const myAns = q.student_text_answer || "-";
        const keyAns = q.options.find(o => o.is_correct)?.text || "-";
        const isCorrect = parseFloat(q.point_earned) > 0;

        return (
            <div className="mt-4 space-y-3">
                <div className={clsx("p-4 rounded-lg border flex justify-between items-center", isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                    <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Jawaban Anda</div>
                        <div className={clsx("text-lg font-mono font-bold", isCorrect ? "text-green-700" : "text-red-700")}>{myAns}</div>
                    </div>
                    {isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                </div>
                {!isCorrect && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="text-xs font-bold text-blue-500 uppercase mb-1">Kunci Jawaban</div>
                        <div className="text-lg font-mono font-bold text-blue-800">{keyAns}</div>
                    </div>
                )}
            </div>
        );
    }

    // 2. PILIHAN GANDA
    return (
        <div className="space-y-3 mt-4">
            {q.options.map((opt) => {
                let isSelected = false;
                let isKey = false;

                if (q.type === 'multiple') {
                    const selectedIds = q.student_selected_options || []; 
                    isSelected = selectedIds.includes(opt.id);
                    isKey = opt.is_correct; 
                } else {
                    isSelected = q.student_answer_id === opt.id;
                    if (q.type === 'weighted') {
                        const maxWeight = Math.max(...q.options.map(o => o.weight));
                        isKey = parseFloat(opt.weight) === maxWeight;
                    } else {
                        isKey = opt.is_correct;
                    }
                }

                let style = "border-gray-200 bg-white opacity-80"; 
                let statusBadge = null;

                if (isSelected) {
                    if (q.type === 'weighted') {
                        style = "border-blue-500 bg-blue-50 ring-1 ring-blue-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Pilihan Anda (+{opt.weight})</span>;
                    } else if (isKey) {
                        style = "border-green-500 bg-green-50 ring-1 ring-green-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle size={12}/> Benar</span>;
                    } else {
                        style = "border-red-500 bg-red-50 ring-1 ring-red-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1"><XCircle size={12}/> Salah</span>;
                    }
                } else if (isKey && q.type !== 'weighted') {
                    style = "border-green-500 bg-green-50 ring-1 ring-green-500 opacity-60 border-dashed";
                    statusBadge = <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1 opacity-70">Kunci Seharusnya</span>;
                }

                const pointBadge = q.type === 'weighted' && (
                    <span className="ml-2 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                        Bobot: {opt.weight}
                    </span>
                );

                return (
                    <div key={opt.id} className={`flex items-start p-3 rounded-lg border ${style} transition-all`}>
                        <div className="flex-shrink-0 mr-3 mt-0.5">
                            {q.type === 'multiple' ? (
                                isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-gray-400"/>
                            ) : (
                                <div className={clsx("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border", isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300")}>
                                    {opt.label}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-sm text-gray-900 font-medium min-w-0">
                            <div className="ql-editor !p-0 prose max-w-none" dangerouslySetInnerHTML={{ __html: opt.text }} />
                            {opt.image && <img src={opt.image} alt="Opsi" className="mt-2 max-h-40 rounded border shadow-sm bg-white" />}
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                            {pointBadge}
                            {statusBadge}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      {/* HEADER NAV */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Dashboard
            </Button>
            <div className="flex items-center gap-2">
                {/* [UBAH] Tombol Download */}
                <Button 
                    variant="outline" 
                    onClick={handleDownloadPDF} 
                    icon={Download}
                    disabled={isDownloading}
                >
                    {isDownloading ? 'Memproses PDF...' : 'Download PDF'}
                </Button>
            </div>
        </div>
      </div>

      {/* WRAPPER UNTUK KONTEN PDF */}
      <div ref={componentRef} className="bg-white">
          
          {/* HEADER CETAK (Tampil di PDF) */}
          <div className="hidden print:block p-8 pb-0 text-center border-b mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Hasil & Pembahasan Tryout</h1>
              <p className="text-gray-500 mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-4 print:px-8">
            {/* JUDUL HALAMAN (Hidden di PDF jika print:hidden bekerja, tapi di html2canvas kita handle via ignoreElements atau CSS) */}
            <h1 className="text-xl font-bold text-gray-900 mb-6 print:hidden">Review Hasil Ujian</h1>

            {/* SCORE CARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center print:border-gray-300">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Skor</span>
                    <span className="text-3xl font-black text-blue-700 mt-1">{formatScore(score)}</span>
                    {reviewData.is_passed ? (
                        <span className="mt-2 px-3 py-1 bg-green-200 text-green-800 text-[10px] font-extrabold rounded-full tracking-wide">LULUS</span>
                    ) : (
                        <span className="mt-2 px-3 py-1 bg-red-200 text-red-800 text-[10px] font-extrabold rounded-full tracking-wide">TIDAK LULUS</span>
                    )}
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center print:border-gray-300">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Benar Sempurna</span>
                    <span className="text-2xl font-bold text-green-700 mt-1">{correct_answers_count} <span className="text-sm text-green-600 font-medium">/ {total_questions}</span></span>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center print:border-gray-300">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Salah / Parsial</span>
                    <span className="text-2xl font-bold text-red-700 mt-1">{wrongOrPartialCount}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center print:border-gray-300">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Pengerjaan</span>
                    <div className="flex items-center mt-1 gap-1 text-gray-700 font-bold">
                        <Clock size={18} /> {duration_taken}
                    </div>
                </div>
            </div>

            {/* BREAKDOWN KATEGORI */}
            {reviewData?.category_scores && reviewData.category_scores.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-6 print:grid-cols-3 print:gap-2">
                    {reviewData.category_scores.map((cat, index) => (
                        <div key={index} className={clsx("p-4 rounded-xl border-2 flex flex-col items-center justify-center print:border-gray-300", 
                            cat.passed ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
                        )}>
                            <span className="text-gray-600 font-bold uppercase text-sm mb-1 text-center">{cat.name}</span>
                            <span className={clsx("text-2xl font-extrabold", cat.passed ? "text-green-700" : "text-red-700")}>
                                {formatScore(cat.score_obtained)}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">PG: {cat.passing_grade}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* LIST SOAL */}
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:px-8 print:space-y-6">
            {questions.map((q, idx) => {
                const earned = parseFloat(q.point_earned || 0);
                const max = parseFloat(q.point_max || q.point || 0);
                
                let headerClass = "";
                let statusText = "";
                let statusIcon = null;

                if (q.type === 'weighted') {
                    headerClass = "bg-blue-50 text-blue-700 border-blue-100";
                    statusText = `Poin: ${formatScore(earned)}`;
                    statusIcon = <Award size={16} />;
                } else if (q.type === 'multiple') {
                    if (earned >= max && max > 0) {
                        headerClass = "bg-green-50 text-green-700 border-green-100";
                        statusText = `Benar Sempurna (+${formatScore(earned)})`;
                        statusIcon = <CheckCircle size={16} />;
                    } else if (earned > 0) {
                        headerClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
                        statusText = `Benar Sebagian (+${formatScore(earned)})`;
                        statusIcon = <AlertTriangle size={16} />;
                    } else {
                        headerClass = "bg-red-50 text-red-700 border-red-100";
                        statusText = "Salah (0 Poin)";
                        statusIcon = <XCircle size={16} />;
                    }
                } else {
                    if (earned > 0) {
                        headerClass = "bg-green-50 text-green-700 border-green-100";
                        statusText = `Benar (+${formatScore(earned)})`;
                        statusIcon = <CheckCircle size={16} />;
                    } else {
                        headerClass = "bg-red-50 text-red-700 border-red-100";
                        statusText = "Salah (0 Poin)";
                        statusIcon = <XCircle size={16} />;
                    }
                }

                return (
                    <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group print:shadow-none print:border-gray-300 print:break-inside-avoid">
                        <div className={`px-6 py-3 border-b flex justify-between items-center ${headerClass} print:border-gray-300`}>
                            <div className="flex items-center gap-3">
                                <span className="bg-white/80 px-2 py-0.5 rounded border border-black/5 text-sm font-bold">No. {q.order_number || idx + 1}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-wide opacity-80 font-semibold">
                                        {q.type === 'multiple' ? 'PG Kompleks' : q.type === 'weighted' ? 'Bobot' : q.type === 'short' ? 'Isian' : 'PG'}
                                    </span>
                                    {(q.category_name || q.category) && <span className="text-[10px] font-bold opacity-70 uppercase">{q.category_name || q.category}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm font-bold mr-4">
                                    {statusIcon} {statusText}
                                </div>
                                <button 
                                    onClick={() => handleOpenReportModal(q.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-medium bg-white/50 px-2 py-1 rounded border border-transparent hover:border-red-200 hover:bg-red-50 print:hidden"
                                >
                                    <Flag size={14} /> Lapor
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="prose max-w-none text-gray-800 text-lg mb-6 ql-editor">
                                <div dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                {q.question_image && <img src={q.question_image} className="mt-4 rounded-lg border max-h-96" alt="Soal" />}
                            </div>

                            {renderAnswerReview(q)}

                            {/* Bagian Laporan (Hidden via print:hidden class + ignoreElements config) */}
                            {q.user_report && (
                                <div className={clsx("mt-6 p-4 rounded-lg border flex gap-3 items-start print:hidden", q.user_report.status === 'resolved' ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200")}>
                                    {/* ... content laporan ... */}
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100 print:border-gray-300">
                                <div className="bg-indigo-50/80 rounded-xl p-5 border border-indigo-100 print:bg-gray-50 print:border-gray-300">
                                    <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                                        <Info size={18} className="text-indigo-600" /> Pembahasan:
                                    </h4>
                                    {q.discussion && q.discussion.trim() !== "" ? (
                                        <div className="text-indigo-800 text-sm leading-relaxed pl-7 ql-editor" dangerouslySetInnerHTML={{ __html: q.discussion }} />
                                    ) : (
                                        <p className="text-gray-400 text-sm italic pl-7">Belum ada pembahasan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
      </div>

      {/* Modal Laporan */}
      <Modal isOpen={isReportModalOpen} onClose={handleCloseReportModal} title="Laporkan Masalah Soal" size="md">
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Masalah</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="4" placeholder="Contoh: Kunci jawaban seharusnya A..." value={reportContent} onChange={(e) => setReportContent(e.target.value)}></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleCloseReportModal}>Batal</Button>
                  <Button onClick={submitReport} loading={reportMutation.isPending} variant="danger">Kirim Laporan</Button>
              </div>
          </div>
      </Modal>

      <style>{`
        .ql-editor img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; display: block; }
        .ql-editor p { margin-bottom: 0.5em; }
        .ql-editor { height: auto !important; }
        .ql-editor.p-0 { padding: 0 !important; }
        @media print {
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-gray-300 { border-color: #d1d5db !important; }
            .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}