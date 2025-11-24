import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { CheckCircle, XCircle, ArrowLeft, Clock, Award, CheckSquare, Square, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';

export default function TryoutReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const { data: reviewData, isLoading, error } = useQuery({
    queryKey: ['tryout-review', resultId],
    queryFn: async () => {
      const res = await api.get(`/student/tryout-results/${resultId}`);
      return res.data.data;
    },
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error || !reviewData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal memuat pembahasan</h2>
      <Button onClick={() => navigate('/student/Progress')}>Kembali ke Progress</Button>
    </div>
  );

  const { score, correct_answers_count, total_questions, duration_taken, questions } = reviewData;
  const wrongOrPartialCount = total_questions - correct_answers_count;

  // --- RENDER JAWABAN ---
  const renderAnswerReview = (q) => {
    // 1. TIPE ISIAN SINGKAT
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

    // 2. TIPE PILIHAN (Single / Weighted / Multiple)
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
                    <div key={opt.id} className={`flex items-center p-3 rounded-lg border ${style} transition-all`}>
                        <div className="flex-shrink-0 mr-3">
                            {q.type === 'multiple' ? (
                                isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-gray-400"/>
                            ) : (
                                <div className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border bg-white text-gray-500 border-gray-300">
                                    {opt.label}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-sm text-gray-900 font-medium">
                            {opt.text}
                            {opt.image && <img src={opt.image} alt="Opsi" className="mt-2 max-h-20 rounded border" />}
                        </div>
                        <div className="flex items-center gap-2">
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
            <Button variant="ghost" onClick={() => navigate('/student/progress')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Progress
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Review Hasil Ujian</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Skor</span>
                <span className="text-3xl font-black text-blue-700 mt-1">{score}</span>
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
                // SKD
                headerClass = "bg-blue-50 text-blue-700 border-blue-100";
                statusText = `Poin SKD: ${earned}`;
                statusIcon = <Award size={16} />;
            } else if (q.type === 'multiple') {
                // KOMPLEKS
                if (earned === max) {
                    headerClass = "bg-green-50 text-green-700 border-green-100";
                    statusText = `Benar Sempurna (+${earned})`;
                    statusIcon = <CheckCircle size={16} />;
                } else if (earned > 0) {
                    headerClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
                    statusText = `Benar Sebagian (+${earned})`;
                    statusIcon = <AlertTriangle size={16} />;
                } else {
                    headerClass = "bg-red-50 text-red-700 border-red-100";
                    statusText = "Salah (0 Poin)";
                    statusIcon = <XCircle size={16} />;
                }
            } else {
                // SINGLE & SHORT (Menampilkan Poin dengan Jelas)
                if (earned === max && max > 0) {
                    headerClass = "bg-green-50 text-green-700 border-green-100";
                    statusText = `Benar (+${earned})`; // [FIXED] Tampilkan Poin
                    statusIcon = <CheckCircle size={16} />;
                } else {
                    headerClass = "bg-red-50 text-red-700 border-red-100";
                    statusText = "Salah (0 Poin)"; // [FIXED] Tampilkan Poin 0
                    statusIcon = <XCircle size={16} />;
                }
            }

            return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className={`px-6 py-3 border-b flex justify-between items-center ${headerClass}`}>
                        <div className="flex items-center gap-3">
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-black/5 text-sm font-bold">No. {idx + 1}</span>
                            <span className="text-xs uppercase tracking-wide opacity-80 font-semibold">
                                {q.type === 'multiple' ? 'Kompleks' : q.type === 'weighted' ? 'Bobot Nilai' : q.type === 'short' ? 'Isian Singkat' : 'Pilihan Ganda'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            {statusIcon} {statusText}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="prose max-w-none text-gray-800 text-lg mb-6">
                            <p className="whitespace-pre-wrap leading-relaxed">{q.question_text}</p>
                            {q.question_image && <img src={q.question_image} className="mt-4 rounded-lg border max-h-96" alt="Soal" />}
                        </div>

                        {renderAnswerReview(q)}

                        {/* PEMBAHASAN (Fixed: Selalu Muncul Kotaknya) */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="bg-indigo-50/80 rounded-xl p-5 border border-indigo-100">
                                <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                                    <Info size={18} className="text-indigo-600" />
                                    Pembahasan:
                                </h4>
                                {q.discussion && q.discussion.trim() !== "" ? (
                                    <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap pl-7">
                                        {q.discussion}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-sm italic pl-7">
                                        Belum ada pembahasan yang dibuat untuk soal ini.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}