import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { CheckCircle, XCircle, ArrowLeft, Clock, Award } from 'lucide-react';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';

export default function TryoutReview() {
  const { resultId } = useParams();
  const navigate = useNavigate();

  // 1. FETCH DATA HASIL (Review Data)
  // Menggunakan endpoint khusus untuk melihat detail hasil & pembahasan
  const { data: reviewData, isLoading, error } = useQuery({
    queryKey: ['tryout-review', resultId],
    queryFn: async () => {
      // Sesuaikan endpoint ini dengan route backend Anda yang mengembalikan detail hasil
      // Biasanya: /api/student/tryout-results/{id}
      const res = await api.get(`/student/tryout-results/${resultId}`);
      return res.data.data; 
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal memuat pembahasan</h2>
        <p className="text-gray-600 mb-4">Data hasil ujian tidak ditemukan atau terjadi kesalahan server.</p>
        <Button onClick={() => navigate('/student/dashboard')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  // Destructure data untuk kemudahan
  // Asumsi struktur data dari backend: 
  // { score: 80, correct_count: 4, total_questions: 5, questions: [ ... ] }
  const { 
    score, 
    correct_answers_count, 
    total_questions, 
    duration_taken, // jika ada
    questions 
  } = reviewData;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* HEADER: Ringkasan Nilai */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="flex items-center text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
            <h1 className="text-lg font-bold text-gray-800">Pembahasan Ujian</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
              <p className="text-xs text-blue-600 uppercase font-bold tracking-wide">Nilai Akhir</p>
              <p className="text-3xl font-extrabold text-blue-700">{score}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
              <p className="text-xs text-green-600 uppercase font-bold tracking-wide">Benar</p>
              <p className="text-xl font-bold text-green-700">{correct_answers_count} <span className="text-sm font-normal text-green-600">/ {total_questions}</span></p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              <p className="text-xs text-red-600 uppercase font-bold tracking-wide">Salah</p>
              <p className="text-xl font-bold text-red-700">{total_questions - correct_answers_count}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Waktu</p>
              <div className="flex items-center justify-center gap-1 text-gray-700 font-bold">
                 <Clock size={16} />
                 <span>{duration_taken || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT: Daftar Soal & Pembahasan */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {questions.map((q, index) => {
          // Logic status jawaban
          // q.student_answer_id -> Jawaban yang dipilih siswa
          // q.correct_answer_id -> Kunci jawaban
          const isCorrect = q.student_answer_id === q.correct_answer_id;
          const isSkipped = !q.student_answer_id;

          return (
            <div key={q.id} className={clsx(
              "bg-white rounded-xl shadow-sm overflow-hidden border-l-4",
              isCorrect ? "border-l-green-500" : isSkipped ? "border-l-gray-400" : "border-l-red-500"
            )}>
              {/* Status Header */}
              <div className={clsx(
                "px-6 py-2 text-xs font-bold uppercase flex justify-between items-center",
                isCorrect ? "bg-green-50 text-green-700" : isSkipped ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-700"
              )}>
                <span>Soal No. {index + 1}</span>
                <span className="flex items-center gap-1">
                  {isCorrect ? <><CheckCircle size={14} /> Benar</> : isSkipped ? "Tidak Diisi" : <><XCircle size={14} /> Salah</>}
                </span>
              </div>

              {/* Soal */}
              <div className="p-6">
                <div className="prose max-w-none mb-6 text-gray-800">
                  <p className="whitespace-pre-wrap">{q.question_text}</p>
                  {q.question_image && (
                    <img src={q.question_image} alt="Soal" className="mt-3 max-h-64 rounded border" />
                  )}
                </div>

                {/* Pilihan Jawaban */}
                <div className="space-y-3">
                  {q.options.map((opt) => {
                    // Cek status opsi ini
                    const isSelected = q.student_answer_id === opt.id;
                    const isKey = q.correct_answer_id === opt.id;

                    let optionStyle = "border-gray-200 bg-white";
                    let icon = null;

                    if (isKey) {
                      // Ini Kunci Jawaban (Selalu hijau)
                      optionStyle = "border-green-500 bg-green-50 ring-1 ring-green-500";
                      icon = <CheckCircle className="text-green-600 w-5 h-5" />;
                    } else if (isSelected && !isKey) {
                      // Ini Jawaban Siswa TAPI Salah (Merah)
                      optionStyle = "border-red-500 bg-red-50";
                      icon = <XCircle className="text-red-600 w-5 h-5" />;
                    } else if (isSelected && isKey) {
                        // Jawaban siswa benar (sudah tercover di blok isKey, tapi untuk safety)
                        optionStyle = "border-green-500 bg-green-50 ring-1 ring-green-500";
                    }

                    return (
                      <div key={opt.id} className={`flex items-start p-3 rounded-lg border ${optionStyle} transition-colors`}>
                        <div className={clsx(
                          "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 border",
                          isKey ? "bg-green-600 text-white border-green-600" : 
                          (isSelected ? "bg-red-600 text-white border-red-600" : "bg-gray-100 text-gray-500 border-gray-300")
                        )}>
                          {opt.label}
                        </div>
                        <div className="flex-1 text-sm text-gray-800">
                          {opt.text}
                          {opt.image && <img src={opt.image} alt="Opsi" className="mt-2 max-h-20 rounded" />}
                        </div>
                        {icon && <div className="ml-2">{icon}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Pembahasan Text (Jika ada) */}
                {q.discussion && (
                    <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <Award size={16} className="mr-2" /> Pembahasan:
                        </h4>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                            {q.discussion}
                        </p>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}