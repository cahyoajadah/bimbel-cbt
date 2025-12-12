import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { CheckCircle, XCircle, ArrowLeft, Clock, Award, CheckSquare, Square, AlertTriangle, Info, Flag, MessageSquare } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Import CSS untuk styling konten HTML (Rumus & Text Editor)
import 'katex/dist/katex.min.css'; 
import 'react-quill/dist/quill.snow.css'; 

export default function TryoutReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [reportContent, setReportContent] = useState('');

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

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error || !reviewData) return <div className="p-10 text-center">Gagal memuat data.</div>;

  const { score, correct_answers_count, total_questions, duration_taken, questions } = reviewData;
  const wrongOrPartialCount = total_questions - correct_answers_count;

  const renderAnswerReview = (q) => {
    if (q.type === 'short') {
        const myAns = q.answer_text || "-";
        const keyAns = q.options.find(o => o.is_correct)?.text || "-";
        const isCorrect = parseFloat(q.point_earned) === parseFloat(q.point_max);

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

    return (
        <div className="space-y-3 mt-4">
            {q.options.map((opt) => {
                let isSelected = false;
                let isKey = false;

                if (q.type === 'multiple') {
                    const selectedIds = q.selected_options || [];
                    isSelected = selectedIds.includes(opt.id);
                    isKey = opt.is_correct;
                } else {
                    isSelected = q.student_answer_id === opt.id;
                    if (q.type === 'weighted') {
                        const maxWeight = Math.max(...q.options.map(o => o.weight));
                        isKey = opt.weight === maxWeight;
                    } else {
                        isKey = opt.is_correct;
                    }
                }

                let style = "border-gray-200 bg-white opacity-80"; 
                let statusBadge = null;

                if (isSelected) {
                    if (q.type === 'weighted') {
                        style = "border-blue-500 bg-blue-50 ring-1 ring-blue-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Pilihan Anda</span>;
                    } else if (isKey) {
                        style = "border-green-500 bg-green-50 ring-1 ring-green-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle size={12}/> Benar</span>;
                    } else {
                        style = "border-red-500 bg-red-50 ring-1 ring-red-500 opacity-100";
                        statusBadge = <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1"><XCircle size={12}/> Salah</span>;
                    }
                } else if (isKey && q.type !== 'weighted') {
                    style = "border-green-500 bg-green-50 ring-1 ring-green-500 opacity-100";
                    statusBadge = <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">Kunci</span>;
                }

                const pointBadge = q.type === 'weighted' && (
                    <span className="ml-2 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                        Poin: {opt.weight}
                    </span>
                );

                return (
                    <div key={opt.id} className={`flex items-start p-3 rounded-lg border ${style} transition-all`}>
                        <div className="flex-shrink-0 mr-3 mt-0.5">
                            {q.type === 'multiple' ? (
                                isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-gray-400"/>
                            ) : (
                                <div className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border bg-white text-gray-500 border-gray-300">
                                    {opt.label}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-sm text-gray-900 font-medium min-w-0">
                            <div 
                                className="ql-editor !p-0 prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: opt.text }}
                            />
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
      {/* Header Stats */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Review Hasil Ujian</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Skor</span>
                <span className="text-3xl font-black text-blue-700 mt-1">{score}</span>
                {/* [FIX] Tampilkan Status Kelulusan Total */}
                {reviewData.is_passed ? (
                     <span className="mt-2 px-3 py-1 bg-green-200 text-green-800 text-[10px] font-extrabold rounded-full tracking-wide">LULUS UJIAN</span>
                ) : (
                     <span className="mt-2 px-3 py-1 bg-red-200 text-red-800 text-[10px] font-extrabold rounded-full tracking-wide">TIDAK LULUS</span>
                )}
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Benar Sempurna</span>
                <span className="text-2xl font-bold text-green-700 mt-1">{correct_answers_count} <span className="text-sm text-green-600 font-medium">/ {total_questions}</span></span>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Salah / Parsial</span>
                <span className="text-2xl font-bold text-red-700 mt-1">{wrongOrPartialCount}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Pengerjaan</span>
                <div className="flex items-center mt-1 gap-1 text-gray-700 font-bold">
                    <Clock size={18} /> {duration_taken}
                </div>
            </div>
          </div>

          {/* [FIX] Breakdown Kategori Skor */}
          {reviewData?.score_details && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-6">
                {['twk', 'tiu', 'tkp'].map((type) => {
                    const details = reviewData.score_details[type];
                    if (!details) return null;
                    const labels = { twk: 'TWK', tiu: 'TIU', tkp: 'TKP' };
                    
                    return (
                        <div key={type} className={clsx("p-4 rounded-xl border-2 flex flex-col items-center justify-center", 
                            details.passed ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
                        )}>
                            <span className="text-gray-600 font-bold uppercase text-sm mb-1">{labels[type]}</span>
                            <span className={clsx("text-2xl font-extrabold", details.passed ? "text-green-700" : "text-red-700")}>
                                {details.score}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">Target Min: {details.passing_grade}</span>
                            {details.passed ? 
                                <span className="mt-2 px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded-full">LULUS</span> :
                                <span className="mt-2 px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded-full">GAGAL</span>
                            }
                        </div>
                    );
                })}
            </div>
          )}

        </div>
      </div>

      {/* Question List */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {questions.map((q, idx) => {
            const earned = parseFloat(q.point_earned || 0);
            const max = parseFloat(q.point_max || 0);
            
            let headerClass = "";
            let statusText = "";
            let statusIcon = null;

            if (q.type === 'weighted') {
                headerClass = "bg-blue-50 text-blue-700 border-blue-100";
                statusText = `Poin: ${earned}`;
                statusIcon = <Award size={16} />;
            } else if (q.type === 'multiple') {
                if (earned === max) {
                    headerClass = "bg-green-50 text-green-700 border-green-100";
                    statusText = `Benar Sempurna (+${earned})`;
                    statusIcon = <CheckCircle size={16} />;
                } else if (earned > 0) {
                    headerClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
                    statusText = `Parsial (+${earned})`;
                    statusIcon = <AlertTriangle size={16} />;
                } else {
                    headerClass = "bg-red-50 text-red-700 border-red-100";
                    statusText = "Salah";
                    statusIcon = <XCircle size={16} />;
                }
            } else {
                if (earned === max && max > 0) {
                    headerClass = "bg-green-50 text-green-700 border-green-100";
                    statusText = `Benar (+${earned})`;
                    statusIcon = <CheckCircle size={16} />;
                } else {
                    headerClass = "bg-red-50 text-red-700 border-red-100";
                    statusText = "Salah (0 Poin)";
                    statusIcon = <XCircle size={16} />;
                }
            }

            return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                    {/* Header Soal */}
                    <div className={`px-6 py-3 border-b flex justify-between items-center ${headerClass}`}>
                        <div className="flex items-center gap-3">
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-black/5 text-sm font-bold">No. {idx + 1}</span>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide opacity-80 font-semibold">
                                    {q.type === 'multiple' ? 'Pilihan Ganda Kompleks' : q.type === 'weighted' ? 'Bobot Nilai' : q.type === 'short' ? 'Isian' : 'Pilihan Ganda'}
                                </span>
                                {/* [FIX] Tampilkan Kategori Soal */}
                                {q.category && <span className="text-[10px] font-bold opacity-70 uppercase">{q.category}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 text-sm font-bold mr-4">
                                {statusIcon} {statusText}
                             </div>
                             
                             {/* Tombol Lapor */}
                             <button 
                                onClick={() => handleOpenReportModal(q.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-medium bg-white/50 px-2 py-1 rounded border border-transparent hover:border-red-200 hover:bg-red-50"
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

                        {/* STATUS LAPORAN & BALASAN ADMIN */}
                        {q.user_report && (
                            <div className={clsx(
                                "mt-6 p-4 rounded-lg border flex gap-3 items-start",
                                q.user_report.status === 'resolved' ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                            )}>
                                <div className={clsx("mt-0.5", q.user_report.status === 'resolved' ? "text-green-600" : "text-yellow-600")}>
                                    {q.user_report.status === 'resolved' ? <CheckCircle size={20}/> : <Clock size={20}/>}
                                </div>
                                <div className="flex-1">
                                    <h5 className={clsx("text-sm font-bold mb-1", q.user_report.status === 'resolved' ? "text-green-800" : "text-yellow-800")}>
                                        {q.user_report.status === 'resolved' ? 'Laporan Diselesaikan' : 'Laporan Dikirim'}
                                    </h5>
                                    <p className="text-xs text-gray-600 mb-2 italic">"{q.user_report.content}"</p>
                                    
                                    {q.user_report.response && (
                                        <div className="bg-white/60 p-3 rounded border border-black/5 text-sm text-gray-800">
                                            <strong>Balasan Admin:</strong> {q.user_report.response}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="bg-indigo-50/80 rounded-xl p-5 border border-indigo-100">
                                <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                                    <Info size={18} className="text-indigo-600" />
                                    Pembahasan:
                                </h4>
                                {q.discussion && q.discussion.trim() !== "" ? (
                                    <div 
                                        className="text-indigo-800 text-sm leading-relaxed pl-7 ql-editor"
                                        dangerouslySetInnerHTML={{ __html: q.discussion }} 
                                    />
                                ) : (
                                    <p className="text-gray-400 text-sm italic pl-7">Belum ada pembahasan untuk soal ini.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Modal Laporan */}
      <Modal 
          isOpen={isReportModalOpen} 
          onClose={handleCloseReportModal} 
          title="Laporkan Masalah Soal"
          size="md"
      >
          <div className="space-y-4">
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-2">
                  <MessageSquare size={18} className="mt-0.5 shrink-0" />
                  <p>Laporan Anda akan dikirim ke pembuat soal. Gunakan fitur ini jika ada kesalahan kunci jawaban, typo, atau gambar error.</p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Masalah</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Contoh: Kunci jawaban seharusnya A..."
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                  ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleCloseReportModal}>Batal</Button>
                  <Button onClick={submitReport} loading={reportMutation.isPending} variant="danger">Kirim Laporan</Button>
              </div>
          </div>
      </Modal>

      {/* Global CSS */}
      <style>{`
        .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 10px 0;
            display: block;
        }
        .ql-editor p {
            margin-bottom: 0.5em;
        }
        .ql-editor {
            height: auto !important;
        }
        .ql-editor.p-0 {
            padding: 0 !important;
        }
        .ql-editor p:first-child {
            margin-top: 0;
        }
        .ql-editor p:last-child {
            margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}