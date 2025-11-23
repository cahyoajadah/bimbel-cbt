// src/pages/student/CBT.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCBTStore } from '../../store/cbtStore';
import { 
  Clock, AlertTriangle, CheckSquare, Square, Circle, CheckCircle2, 
  AlertOctagon, ChevronLeft, ChevronRight, Grid, RefreshCw 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import screenfull from 'screenfull';

export default function CBT() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  // --- LOCAL STATE & REFS ---
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityViolationType, setSecurityViolationType] = useState(null); 
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [textAnswer, setTextAnswer] = useState(''); 
  const [isExiting, setIsExiting] = useState(false);
  
  const violationCountRef = useRef(0); 
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    warningCount,
    isAutoSaving, 
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

  // --- DATA FETCHING ---
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['cbt-questions', sessionId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CBT_QUESTIONS);
      return res.data.data;
    },
    enabled: !!sessionId,
  });

  // --- MUTATIONS ---
  const saveAnswerMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post(API_ENDPOINTS.CBT_ANSWER, payload);
    },
    onSuccess: () => {
        setTimeout(() => setAutoSaving(false), 500); 
    },
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
      setIsExiting(false);
      toast.error("Gagal submit. Coba lagi.");
    },
  });

  // --- ANSWER HANDLING ---
  const handleAnswerChange = useCallback((qType, value) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const questionId = currentQ.id;
    
    if (qType !== 'short') { 
        saveAnswer(questionId, value);
    } else {
        saveAnswer(questionId, value);
    }
    
    setAutoSaving(true);

    const payload = { question_id: questionId };
    if (qType === 'short') {
        payload.answer_text = value;
    } else if (qType === 'multiple') {
        payload.selected_options = value;
    } else {
        payload.answer_option_id = value;
    }
    saveAnswerMutation.mutate(payload);
  }, [questions, currentQuestionIndex, saveAnswer, saveAnswerMutation]);

  // --- AUTO SAVE LOGIC (DEBOUNCE) ---
  useEffect(() => {
    const currentQ = questions && questions[currentQuestionIndex];
    if (!currentQ || currentQ.type !== 'short') return;

    const storedAnswer = answers[currentQ.id] || '';
    if (textAnswer === storedAnswer) return;

    const timer = setTimeout(() => {
        handleAnswerChange('short', textAnswer);
    }, 1000); 

    return () => clearTimeout(timer);
  }, [textAnswer, currentQuestionIndex, questions, answers, handleAnswerChange]);

  useEffect(() => {
    if (questions && questions.length > 0) {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ && currentQ.type === 'short') {
            setTextAnswer(answers[currentQ.id] || '');
        }
    }
  }, [currentQuestionIndex, answers, questions]);

  // --- SUBMIT & TIMER ---
  const handlePreSubmitCheck = () => setShowConfirmSubmit(true);
  const confirmSubmitExam = () => {
    setShowConfirmSubmit(false);
    setIsExiting(true);
    setSubmitting(true);
    submitMutation.mutate();
  };

  useEffect(() => {
    if (timeRemaining > 0 && questions.length > 0) {
      startTimer(() => {
        setIsExiting(true);
        setSubmitting(true);
        submitMutation.mutate();
      });
    }
    return () => stopTimer();
  }, [questions.length]);

  // --- SECURITY ---
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

        if (!isNowFullscreen && !isExiting) {
          violationCountRef.current += 1;
          const currentViolations = violationCountRef.current;
          fullscreenWarningMutation.mutate();
          incrementWarning();

          if (currentViolations === 1) {
            setSecurityViolationType('warning');
            setShowSecurityModal(true);
          } else if (currentViolations >= 2) {
             setSecurityViolationType('lockout');
             setShowSecurityModal(true);
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

  const handleResumeExam = () => {
    if (screenfull.isEnabled) {
      screenfull.request().then(() => setShowSecurityModal(false))
      .catch(() => toast.error("Gagal masuk layar penuh. Klik lagi."));
    }
  };

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    return () => document.removeEventListener('contextmenu', preventDefault);
  }, []);

  // --- RENDER HELPERS ---
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${hours}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const renderAnswerInput = (question) => {
    const currentAns = answers[question.id];

    if (question.type === 'short') {
        return (
            <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Jawaban Isian:</label>
                <div className="relative">
                    <input
                        type="text"
                        className={clsx(
                            "w-full p-4 border-2 rounded-xl font-mono text-lg transition-all outline-none",
                            isAutoSaving 
                                ? "border-yellow-400 bg-yellow-50 focus:ring-yellow-200" 
                                : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        )}
                        placeholder="Ketik jawaban Anda di sini..."
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        onBlur={(e) => handleAnswerChange('short', e.target.value)}
                    />
                    {/* ICON SAVE DIHAPUS DI SINI */}
                </div>
                <div className="mt-2 flex justify-end">
                    {isAutoSaving ? (
                        <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                            <RefreshCw size={12} className="animate-spin" /> Menyimpan otomatis...
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">
                            *Jawaban tersimpan otomatis
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 mt-4">
            {question.options?.map((opt) => {
                let isSelected = false;
                if (question.type === 'multiple') {
                    isSelected = Array.isArray(currentAns) && currentAns.includes(opt.id);
                } else {
                    isSelected = currentAns === opt.id;
                }

                return (
                    <button
                        key={opt.id}
                        onClick={() => {
                            if (question.type === 'multiple') {
                                const newSelection = Array.isArray(currentAns) ? [...currentAns] : [];
                                const idx = newSelection.indexOf(opt.id);
                                if (idx > -1) newSelection.splice(idx, 1);
                                else newSelection.push(opt.id);
                                handleAnswerChange('multiple', newSelection);
                            } else {
                                handleAnswerChange(question.type, opt.id);
                            }
                        }}
                        className={clsx(
                            "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group relative overflow-hidden",
                            isSelected 
                                ? "bg-blue-600 border-blue-600 shadow-md" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <div className={clsx(
                            "flex-shrink-0 w-8 h-8 flex items-center justify-center transition-all duration-200",
                            isSelected ? "text-white scale-110" : "text-gray-400 group-hover:text-gray-600"
                        )}>
                            {question.type === 'multiple' 
                                ? (isSelected ? <CheckSquare size={24} className="text-white" /> : <Square size={24} />)
                                : (isSelected ? <CheckCircle2 size={24} className="text-white" /> : <Circle size={24} />)
                            }
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex gap-2">
                                {opt.label && <span className={clsx("font-bold min-w-[1.5rem]", isSelected ? "text-white" : "text-gray-700")}>{opt.label}.</span>}
                                <div className={clsx("leading-relaxed font-medium", isSelected ? "text-white" : "text-gray-800")}>{opt.text}</div>
                            </div>
                            {opt.image && <img src={opt.image} alt="Opsi" className="mt-3 max-h-40 rounded-lg border border-gray-200 shadow-sm bg-white" />}
                        </div>
                    </button>
                )
            })}
        </div>
    );
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-50">Memuat Soal...</div>;
  if (!questions || questions.length === 0) return <div className="p-10 text-center bg-gray-50 h-screen">Soal tidak ditemukan.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = getProgress();
  const unansweredCount = questions.length - progress.answered;

  return (
    <div className="min-h-screen bg-gray-50 select-none flex flex-col" onCopy={(e)=>e.preventDefault()}>
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2 shadow-sm">
                <Clock className={timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-blue-600'} size={20} />
                <span className={clsx("text-xl font-mono font-bold", timeRemaining < 300 ? 'text-red-600' : 'text-gray-800')}>
                    {formatTime(timeRemaining)}
                </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {warningCount > 0 && (
              <div className="hidden sm:flex bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold items-center gap-2 border border-red-200 animate-pulse">
                 <AlertTriangle size={14} /> {warningCount}/2
              </div>
            )}
            <div className="flex items-center gap-2">
                {/* Indikator Global Loading */}
                {isAutoSaving && <RefreshCw size={18} className="animate-spin text-blue-600" />}
                
                <Button variant="success" onClick={handlePreSubmitCheck} loading={submitMutation.isPending} className="shadow-sm rounded-xl px-6">
                Selesai
                </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* KIRI: SOAL AREA */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            
            {/* Question Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    No. {currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-wide shadow-sm">
                    {currentQuestion.type === 'multiple' ? 'Pilihan Ganda Kompleks' : 
                     currentQuestion.type === 'weighted' ? 'Bobot Nilai' :
                     currentQuestion.type === 'short' ? 'Isian Singkat' : 'Pilihan Ganda'}
                  </span>
              </div>
              <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded">Bobot: {currentQuestion.point}</span>
            </div>
            
            {/* Question Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
               <div className="prose max-w-none mb-8">
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {currentQuestion.question_text}
                  </p>
                  {currentQuestion.question_image && (
                    <img 
                        src={currentQuestion.question_image} 
                        className="mt-6 rounded-xl border border-gray-200 shadow-sm max-h-96 object-contain bg-gray-50" 
                        alt="Soal Visual" 
                    />
                  )}
               </div>

               {renderAnswerInput(currentQuestion)}
            </div>

            {/* Navigation Footer */}
            <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <button 
                disabled={currentQuestionIndex === 0} 
                onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
                <span>Sebelumnya</span>
              </button>

              <button 
                disabled={currentQuestionIndex === questions.length - 1} 
                onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* KANAN: NAVIGASI GRID */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Grid size={18} className="text-blue-600" />
                Navigasi Soal
             </h3>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                <div className="grid grid-cols-5 gap-3">
                    {questions.map((q, idx) => {
                    const ans = answers[q.id];
                    const isAns = Array.isArray(ans) ? ans.length > 0 : (ans !== undefined && ans !== null && ans !== '');
                    const isCurr = idx === currentQuestionIndex;
                    
                    return (
                        <button 
                        key={q.id} 
                        onClick={() => setCurrentQuestion(idx)}
                        className={clsx(
                            "h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center shadow-sm border",
                            isCurr 
                                ? "bg-blue-600 text-white border-blue-600"
                                : isAns 
                                    ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                        >
                        {idx + 1}
                        </button>
                    )
                    })}
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 shrink-0">
                <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                    <span>Progress: {Math.round(progress.percentage)}%</span>
                    <span>{progress.answered}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress.percentage}%` }}
                    ></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl text-center border-t-4 border-yellow-500 animate-in fade-in zoom-in-95 duration-200">
            {securityViolationType === 'warning' ? (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Peringatan Keamanan</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  Anda keluar dari mode layar penuh. <br/>
                  <span className="font-bold text-red-600">Ini adalah peringatan terakhir.</span>
                </p>
                <button onClick={handleResumeExam} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                  Kembali Mengerjakan
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertOctagon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Diskualifikasi</h2>
                <p className="text-gray-600 mb-4 text-sm">Sistem menghentikan ujian karena pelanggaran berulang.</p>
              </>
            )}
          </div>
        </div>
      )}

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Kumpulkan Jawaban?</h3>
            {unansweredCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 items-start">
                 <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                 <div className="text-sm text-amber-800 text-left">
                    Masih ada <span className="font-bold text-amber-900">{unansweredCount} soal</span> kosong.
                 </div>
              </div>
            ) : <p className="text-gray-500 mb-6 text-sm">Pastikan Anda sudah yakin dengan semua jawaban.</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">Batal</button>
              <button onClick={confirmSubmitExam} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold">Kumpulkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}