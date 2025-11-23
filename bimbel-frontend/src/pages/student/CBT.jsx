// src/pages/student/CBT.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCBTStore } from '../../store/cbtStore';
import { Clock, AlertTriangle, CheckCircle, Lock, AlertOctagon } from 'lucide-react'; // Tambah icon
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import screenfull from 'screenfull';

export default function CBT() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  // --- STATE UNTUK CUSTOM MODAL ---
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityViolationType, setSecurityViolationType] = useState(null); // 'warning' | 'lockout'
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false); // Ganti window.confirm
  
  const [isExiting, setIsExiting] = useState(false);
  const violationCountRef = useRef(0); 
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    warningCount,
    setCurrentQuestion,
    saveAnswer,
    startTimer,
    stopTimer,
    incrementWarning,
    setFullscreen,
    setAutoSaving,
    setSubmitting,
    resetSession,
    getProgress,
  } = useCBTStore();

  // 1. Fetch Data Questions
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['cbt-questions', sessionId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CBT_QUESTIONS);
      return res.data.data;
    },
    enabled: !!sessionId,
  });

  // 2. Mutations
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answerOptionId }) => {
      await api.post(API_ENDPOINTS.CBT_ANSWER, {
        question_id: questionId,
        answer_option_id: answerOptionId,
      });
    },
    onSuccess: () => setAutoSaving(false),
    onError: () => {
      setAutoSaving(false);
      toast.error('Gagal menyimpan jawaban (Cek koneksi)');
    },
  });

  const fullscreenWarningMutation = useMutation({
    mutationFn: async () => {
      await api.post(API_ENDPOINTS.CBT_FULLSCREEN_WARNING);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(API_ENDPOINTS.CBT_SUBMIT);
      return res.data;
    },
    onSuccess: (data) => {
      const resultId = data.data.id;
      stopTimer();
      resetSession();
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit();
      }
      toast.success('Ujian selesai!');
      navigate(`/student/tryout-review/${resultId}`);
    },
    onError: () => {
      setSubmitting(false);
      toast.error("Gagal submit. Coba lagi.");
    },
  });

  // 3. Logic Submit & Validasi (Custom Modal)
  const handlePreSubmitCheck = () => {
    setShowConfirmSubmit(true); // Buka modal konfirmasi custom
  };

  const confirmSubmitExam = () => {
    setShowConfirmSubmit(false);
    setIsExiting(true);
    setSubmitting(true);
    submitMutation.mutate();
  };

  // 4. Logic Timer
  useEffect(() => {
    if (timeRemaining > 0 && questions.length > 0) {
      startTimer(() => {
        // Saat waktu habis, langsung submit paksa
        setIsExiting(true);
        setSubmitting(true);
        submitMutation.mutate();
      });
    }
    return () => stopTimer();
  }, []); 

  // 5. LOGIKA BARU: Fullscreen Monitor dengan Custom Modal
  useEffect(() => {
    const enterFullscreen = async () => {
      if (screenfull.isEnabled) {
        try {
          await screenfull.request();
          setFullscreen(true);
        } catch (err) {
          console.error(err);
        }
      }
    };
    enterFullscreen();

    const handleFullscreenChange = () => {
      if (screenfull.isEnabled) {
        const isNowFullscreen = screenfull.isFullscreen;
        setFullscreen(isNowFullscreen);

        // Jika keluar fullscreen DAN bukan karena sedang submit/selesai
        if (!isNowFullscreen && !isExiting) {
          
          violationCountRef.current += 1;
          const currentViolations = violationCountRef.current;

          // Log ke server
          fullscreenWarningMutation.mutate();
          incrementWarning();

          if (currentViolations === 1) {
            // Pelanggaran 1: Tampilkan Custom Warning Modal
            setSecurityViolationType('warning');
            setShowSecurityModal(true);
          } else if (currentViolations >= 2) {
             // Pelanggaran 2: Tampilkan Modal Lockout & Auto Submit
             setSecurityViolationType('lockout');
             setShowSecurityModal(true);
             
             // Beri delay 3 detik agar siswa sempat baca pesan "Didiskualifikasi" sebelum redirect
             setTimeout(() => {
                setIsExiting(true);
                setSubmitting(true);
                submitMutation.mutate();
             }, 3000);
          }
        }
      }
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }
    return () => {
      if (screenfull.isEnabled) screenfull.off('change', handleFullscreenChange);
    };
  }, [isExiting]);

  // 6. Fungsi untuk Tombol di Modal Peringatan (Solusi agar Fullscreen jalan)
  const handleResumeExam = () => {
    // Karena ini dipanggil oleh onClick (user event), requestFullscreen PASTI berhasil
    if (screenfull.isEnabled) {
      screenfull.request().then(() => {
        setShowSecurityModal(false); // Tutup modal hanya jika sukses fullscreen
      }).catch((err) => {
        toast.error("Gagal masuk layar penuh. Coba lagi.");
      });
    }
  };

  // 7. Anti Cheating (Copy Paste)
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('cut', preventDefault);
    
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('cut', preventDefault);
    };
  }, []);

  const handleAnswerSelect = useCallback((questionId, optionId) => {
    saveAnswer(questionId, optionId);
    setAutoSaving(true);
    saveAnswerMutation.mutate({ questionId, answerOptionId: optionId });
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${hours}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  // --- RENDER HELPERS ---

  if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat Soal...</div>;
  if (!questions || questions.length === 0) return <div className="p-10 text-center">Soal tidak ditemukan.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = getProgress();
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-100 select-none" onCopy={(e)=>e.preventDefault()}>
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'} />
            <span className="text-xl font-mono font-bold text-gray-800">{formatTime(timeRemaining)}</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Indikator Warning */}
            {warningCount > 0 && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                 <AlertTriangle size={14} /> Pelanggaran: {warningCount}/2
              </div>
            )}
            <Button variant="success" onClick={handlePreSubmitCheck} loading={submitMutation.isPending}>
              Selesai Ujian
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kiri: Soal */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-semibold">Soal No. {currentQuestionIndex + 1}</span>
              <span className="text-gray-500 text-sm">Bobot: {currentQuestion.point || 5} Poin</span>
            </div>
            
            <div className="prose max-w-none mb-8">
               <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{currentQuestion.question_text}</p>
               {currentQuestion.question_image && <img src={currentQuestion.question_image} className="mt-4 rounded-lg border" alt="Soal" />}
            </div>

            <div className="space-y-3">
              {currentQuestion.options?.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswerSelect(currentQuestion.id, opt.id)}
                    className={clsx(
                      "w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3 group",
                      isSelected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:bg-gray-50 hover:border-blue-300"
                    )}
                  >
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm", isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600 group-hover:bg-gray-300")}>{opt.label}</div>
                    <div className="flex-1">
                      <div className="text-gray-800">{opt.text}</div>
                      {opt.image && <img src={opt.image} alt="Opsi" className="mt-2 max-h-32 rounded" />}
                    </div>
                    {isSelected && <CheckCircle className="text-blue-600 w-6 h-6" />}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}>Sebelumnya</Button>
            <Button disabled={currentQuestionIndex === questions.length - 1} onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}>Selanjutnya</Button>
          </div>
        </div>

        {/* Kanan: Navigasi */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
             <h3 className="font-bold text-gray-700 mb-4">Navigasi Soal</h3>
             <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAns = !!answers[q.id];
                  const isCurr = idx === currentQuestionIndex;
                  return (
                    <button 
                      key={q.id} 
                      onClick={() => setCurrentQuestion(idx)}
                      className={clsx(
                        "h-10 rounded-md text-sm font-medium transition-all border",
                        isCurr ? "ring-2 ring-blue-500 ring-offset-1 border-blue-500 z-10" : "border-transparent",
                        isAns ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
             </div>
             <div className="mt-6 pt-4 border-t text-xs space-y-2 text-gray-600">
                <div className="flex justify-between"><span>Terjawab:</span> <span className="font-bold text-green-600">{progress.answered}</span></div>
                <div className="flex justify-between"><span>Belum Dijawab:</span> <span className="font-bold text-gray-600">{unansweredCount}</span></div>
             </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CUSTOM MODALS AREA (Menggantikan Alert Browser)                   */}
      {/* ================================================================= */}

      {/* 1. MODAL SECURITY VIOLATION (FULLSCREEN) */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl text-center animate-bounce-in">
            
            {securityViolationType === 'warning' ? (
              <>
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Peringatan Keamanan!</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Anda terdeteksi keluar dari mode layar penuh. <br/>
                  <span className="font-bold text-red-600">Ini adalah Peringatan Terakhir.</span><br/>
                  Jika Anda keluar sekali lagi, ujian akan otomatis disubmit.
                </p>
                <button 
                  onClick={handleResumeExam} // KLIK INI MEMICU FULLSCREEN
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95"
                >
                  Saya Paham & Kembali ke Ujian
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertOctagon className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ujian Dihentikan</h2>
                <p className="text-gray-600 mb-6">
                  Anda telah melakukan pelanggaran fullscreen berulang kali.<br/>
                  Sistem sedang menyimpan jawaban Anda dan mengakhiri sesi ini secara otomatis.
                </p>
                <div className="flex justify-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. MODAL KONFIRMASI SUBMIT */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Kumpulkan Jawaban?</h3>
            
            {unansweredCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex gap-3">
                 <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                 <div className="text-sm text-amber-800 text-left">
                    Masih ada <span className="font-bold">{unansweredCount} soal</span> yang belum diisi. Nilai kosong akan dihitung nol.
                 </div>
              </div>
            ) : (
               <p className="text-gray-600 mb-6">Pastikan Anda sudah memeriksa kembali semua jawaban sebelum mengakhiri ujian.</p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Periksa Lagi
              </button>
              <button 
                onClick={confirmSubmitExam}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}