// src/pages/student/CBT.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCBTStore } from '../../store/cbtStore';
import { 
  Clock, AlertTriangle, CheckSquare, Square, Circle, CheckCircle2, 
  ChevronLeft, ChevronRight, Grid, RefreshCw, WifiOff,
  Maximize, PlayCircle, Minimize, AlertOctagon
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner'; 
import { studentService } from '../../api/services/studentService';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import screenfull from 'screenfull';

import 'katex/dist/katex.min.css'; 
import 'react-quill/dist/quill.snow.css';

export default function CBT() {
  const navigate = useNavigate();
  const { packageId } = useParams(); 
  
  // --- LOCAL STATE ---
  const [hasStarted, setHasStarted] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityViolationType, setSecurityViolationType] = useState(null); 
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [textAnswer, setTextAnswer] = useState(''); 
  const [isExiting, setIsExiting] = useState(false);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('cbt_token'));
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResumedSession, setIsResumedSession] = useState(false);

  const violationCountRef = useRef(0); 
  const initRef = useRef(false);

  // --- ZUSTAND STORE ---
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
    initSession
  } = useCBTStore();

  // [FIX 1] PINDAHKAN LOGIKA VARIABEL KE ATAS SINI
  // Agar bisa diakses oleh fungsi handlePreSubmitCheck
  const currentQuestion = questions[currentQuestionIndex] || {};
  const progress = getProgress();
  const unansweredCount = questions.length - progress.answered;

  // --- 1. CORE INITIALIZATION ---
  useEffect(() => {
    if (initRef.current) return;

    const initializeCBT = async () => {
        try {
            setIsLoadingInit(true);
            initRef.current = true;

            if (!packageId) throw new Error("ID Paket tidak valid");

            // A. Start/Resume Session
            const sessionRes = await studentService.startTryoutSession(packageId);
            const sessionData = sessionRes.data;
            const token = sessionData.session_token;

            setSessionToken(token);
            localStorage.setItem('cbt_token', token);

            // B. Fetch Questions
            const questionsRes = await studentService.getTryoutQuestions(token);
            const questionsData = questionsRes.data;

            // C. Hitung Sisa Waktu
            const now = new Date();
            const startTime = new Date(sessionData.start_time);
            const durationMs = sessionData.duration_minutes * 60000;
            const endTime = new Date(startTime.getTime() + durationMs);
            const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

            // D. Masukkan ke Store
            initSession(sessionData, questionsData);
            useCBTStore.setState({ timeRemaining: remainingSeconds });

            // E. Restore Jawaban Lokal
            const backupKey = `cbt_backup_${packageId}`;
            const localBackup = localStorage.getItem(backupKey);
            if (localBackup) {
                try {
                    const parsedBackup = JSON.parse(localBackup);
                    Object.entries(parsedBackup).forEach(([qId, val]) => {
                         saveAnswer(parseInt(qId), val);
                    });
                    toast.success('Jawaban lokal dipulihkan.');
                } catch (e) {
                    console.error("Gagal restore backup", e);
                }
            }

            // F. Handle Resume
            if (sessionData.is_resumed) {
                setIsResumedSession(true);
                // [FIX 2] JANGAN setHasStarted(true) disini.
                // Biarkan user klik tombol "Lanjutkan" agar Fullscreen bisa jalan.
            }

        } catch (error) {
            console.error("Gagal inisialisasi:", error);
            initRef.current = false;
            const msg = error.response?.data?.message || "Gagal memuat ujian";
            if (error.response?.status === 409 || error.response?.status === 403) {
                toast.error(msg);
                navigate('/student/tryouts');
            } else {
                toast.error("Terjadi kesalahan koneksi.");
            }
        } finally {
            setIsLoadingInit(false);
        }
    };

    initializeCBT();
    
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]); 

  // --- LOCAL STORAGE BACKUP ---
  useEffect(() => {
    if (hasStarted && Object.keys(answers).length > 0) {
        const backupKey = `cbt_backup_${packageId}`;
        localStorage.setItem(backupKey, JSON.stringify(answers));
    }
  }, [answers, hasStarted, packageId]);

  // --- MUTATIONS ---
  const saveAnswerMutation = useMutation({
    mutationFn: async (payload) => {
      if (!sessionToken) return;
      await studentService.saveAnswer(sessionToken, payload);
    },
    onSuccess: () => {
        setTimeout(() => setAutoSaving(false), 500); 
    },
    onError: () => setAutoSaving(false),
  });

  const fullscreenWarningMutation = useMutation({
    mutationFn: async () => {
       if (!sessionToken) return;
       await studentService.fullscreenWarning(sessionToken); 
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) throw new Error("Token hilang");
      const res = await studentService.submitTryout(sessionToken);
      return res;
    },
    onSuccess: (data) => {
      const resultId = data.data.id;
      stopTimer();
      const backupKey = `cbt_backup_${packageId}`;
      localStorage.removeItem(backupKey);
      localStorage.removeItem('cbt_token');
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
      toast.error("Gagal submit. Periksa koneksi internet Anda.");
    },
  });

  // --- HANDLERS ---
  const handleAnswerChange = useCallback((qType, value) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const questionId = currentQ.id;
    saveAnswer(questionId, value); 
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

  // Debounce Text Input
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

  // Sync Text Input
  useEffect(() => {
    if (questions && questions.length > 0) {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ && currentQ.type === 'short') {
            setTextAnswer(answers[currentQ.id] || '');
        }
    }
  }, [currentQuestionIndex, questions, answers]);

  // --- START EXAM LOGIC ---
  const handleStartExam = async () => {
    // 1. Request Fullscreen (Wajib interaksi user)
    if (screenfull.isEnabled) {
        try {
            await screenfull.request();
            setFullscreen(true);
            setIsFullscreen(true);
        } catch (err) {
            console.error("Fullscreen blocked:", err);
            toast.error("Gagal masuk mode layar penuh.");
        }
    }
    
    // 2. Mulai Timer dan UI
    setHasStarted(true);
    startTimer(() => {
        setIsExiting(true);
        setSubmitting(true);
        submitMutation.mutate();
    });
  };

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled) {
        if (screenfull.isFullscreen) {
            if (window.confirm("Keluar dari mode layar penuh akan dicatat sebagai pelanggaran. Yakin?")) {
                screenfull.exit();
            }
        } else {
            screenfull.request().then(() => {
                setIsFullscreen(true);
                setFullscreen(true);
            });
        }
    } else {
        toast.error("Browser tidak mendukung layar penuh.");
    }
  };

  // --- SECURITY MONITORS ---
  const handleViolation = useCallback(() => {
      if(isExiting || !hasStarted) return; 

      violationCountRef.current += 1;
      const currentViolations = violationCountRef.current;
      
      fullscreenWarningMutation.mutate();
      incrementWarning();

      if (currentViolations === 1) {
        setSecurityViolationType('warning');
        setShowSecurityModal(true);
      } else if (currentViolations >= 3) {
         setSecurityViolationType('lockout');
         setShowSecurityModal(true);
         setTimeout(() => {
            setIsExiting(true);
            setSubmitting(true);
            submitMutation.mutate();
         }, 3000);
      }
  }, [isExiting, hasStarted, fullscreenWarningMutation, incrementWarning, submitMutation]);

  useEffect(() => {
    if (!hasStarted) return; 

    const handleFullscreenChange = () => {
      if (screenfull.isEnabled) {
        const isNowFullscreen = screenfull.isFullscreen;
        setIsFullscreen(isNowFullscreen);
        setFullscreen(isNowFullscreen);

        if (!isNowFullscreen && !isExiting) {
          handleViolation();
        }
      }
    };

    const handleVisibilityChange = () => {
        if (document.hidden && !isExiting) {
            handleViolation();
        }
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    const preventContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventContext);

    return () => {
      if (screenfull.isEnabled) screenfull.off('change', handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener('contextmenu', preventContext);
    };
  }, [hasStarted, isExiting, handleViolation, setFullscreen]);

  // --- UI HANDLERS ---
  const handleResumeExam = () => {
    if (screenfull.isEnabled) {
      screenfull.request().then(() => {
          setShowSecurityModal(false);
          setIsFullscreen(true);
      }).catch(() => {
         setShowSecurityModal(false);
         toast("Silakan tekan F11 jika layar tidak penuh.");
      });
    } else {
        setShowSecurityModal(false);
    }
  };

  const handlePreSubmitCheck = () => setShowConfirmSubmit(true);
  const confirmSubmitExam = () => {
    setShowConfirmSubmit(false);
    setIsExiting(true);
    setSubmitting(true);
    submitMutation.mutate();
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return "--:--:--";
    const hours = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${hours}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  // --- RENDERERS ---
  if (isLoadingInit) return <div className="flex justify-center items-center h-screen bg-gray-50"><LoadingSpinner text="Menyiapkan Ujian..." /></div>;
  if (!questions || questions.length === 0) return <div className="p-10 text-center bg-gray-50 h-screen text-gray-500 flex flex-col justify-center items-center">
      <AlertTriangle size={48} className="mb-4 text-yellow-500" />
      <h2 className="text-xl font-bold mb-2">Soal tidak ditemukan</h2>
      <Button className="mt-4" onClick={() => navigate('/student/tryouts')}>Kembali</Button>
  </div>;

  // --- START SCREEN ---
  if (!hasStarted) {
      return (
          <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
              <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                      <PlayCircle size={40} />
                  </div>
                  
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                          {isResumedSession ? "Lanjutkan Ujian" : "Siap Mengerjakan?"}
                      </h1>
                      <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                          Ujian akan masuk ke mode layar penuh. <br/>
                          Jangan keluar dari layar penuh atau berpindah tab selama ujian berlangsung.
                      </p>
                  </div>

                  <div className="bg-yellow-50 text-yellow-800 text-sm p-4 rounded-xl text-left flex gap-3 border border-yellow-100">
                      <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                      <div>
                          <span className="font-bold">Peringatan:</span> Pelanggaran akan dicatat dan dapat menyebabkan diskualifikasi.
                      </div>
                  </div>

                  <button 
                      onClick={handleStartExam}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                      <Maximize size={20} />
                      {isResumedSession ? "Lanjutkan Sekarang" : "Mulai Ujian Sekarang"}
                  </button>
              </div>
          </div>
      );
  }

  // --- MAIN EXAM UI ---
  return (
    <div className="min-h-screen bg-gray-50 select-none flex flex-col font-sans" onCopy={(e)=>e.preventDefault()}>
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2 shadow-sm min-w-[140px] justify-center">
                <Clock className={timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-blue-600'} size={20} />
                <span className={clsx("text-xl font-mono font-bold", timeRemaining < 300 ? 'text-red-600' : 'text-gray-800')}>
                    {formatTime(timeRemaining)}
                </span>
            </div>
            <button 
                onClick={handleToggleFullscreen}
                className={`p-2 rounded-full hidden sm:block transition-colors ${isFullscreen ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
                title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
            >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {saveAnswerMutation.isError && (
                <div className="hidden sm:flex text-red-600 text-xs font-bold items-center gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <WifiOff size={14} /> Gagal Simpan
                </div>
            )}
            {warningCount > 0 && (
              <div className="hidden sm:flex bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold items-center gap-2 border border-red-200 animate-pulse">
                 <AlertTriangle size={14} /> {warningCount}/3
              </div>
            )}
            <div className="flex items-center gap-3">
                {isAutoSaving && <RefreshCw size={18} className="animate-spin text-blue-600" />}
                <Button variant="success" onClick={handlePreSubmitCheck} loading={submitMutation.isPending} className="shadow-sm rounded-xl px-4 sm:px-6">
                Selesai
                </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KIRI: SOAL */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    No. {currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-wide shadow-sm hidden sm:inline-block">
                    {currentQuestion.type === 'multiple' ? 'PG Kompleks' : 
                     currentQuestion.type === 'weighted' ? 'Bobot Nilai' :
                     currentQuestion.type === 'short' ? 'Isian' : 'Pilihan Ganda'}
                  </span>
              </div>
              <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded">Poin: {currentQuestion.point}</span>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
               <div className="prose max-w-none mb-8 ql-editor">
                  <div 
                    className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
                  />
                  {currentQuestion.question_image && (
                    <img 
                        src={currentQuestion.question_image} 
                        className="mt-6 rounded-xl border border-gray-200 shadow-sm max-h-96 object-contain bg-gray-50" 
                        alt="Soal Visual" 
                    />
                  )}
               </div>

               {(() => {
                   const currentAns = answers[currentQuestion.id];
                   
                   if (currentQuestion.type === 'short') {
                       return (
                           <div className="mt-6 max-w-2xl">
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
                                       placeholder="Ketik jawaban..."
                                       value={textAnswer}
                                       onChange={(e) => setTextAnswer(e.target.value)}
                                       onBlur={(e) => handleAnswerChange('short', e.target.value)}
                                   />
                               </div>
                               <div className="mt-2 flex justify-end">
                                   {isAutoSaving ? (
                                       <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                                           <RefreshCw size={12} className="animate-spin" /> Menyimpan...
                                       </span>
                                   ) : (
                                       <span className="text-xs text-gray-400 flex items-center gap-1">
                                           <CheckCircle2 size={12} className="text-green-500"/> Tersimpan
                                       </span>
                                   )}
                               </div>
                           </div>
                       );
                   }

                   return (
                       <div className="space-y-3 mt-4">
                           {currentQuestion.options?.map((opt, idx) => {
                               let isSelected = false;
                               if (currentQuestion.type === 'multiple') {
                                   isSelected = Array.isArray(currentAns) && currentAns.includes(opt.id);
                               } else {
                                   isSelected = currentAns === opt.id;
                               }
                               
                               const label = opt.label ? opt.label.replace('.', '') : String.fromCharCode(65 + idx);

                               return (
                                   <button
                                       key={opt.id}
                                       onClick={() => {
                                           if (currentQuestion.type === 'multiple') {
                                               const newSelection = Array.isArray(currentAns) ? [...currentAns] : [];
                                               const idx = newSelection.indexOf(opt.id);
                                               if (idx > -1) newSelection.splice(idx, 1);
                                               else newSelection.push(opt.id);
                                               handleAnswerChange('multiple', newSelection);
                                           } else {
                                               handleAnswerChange(currentQuestion.type, opt.id);
                                           }
                                       }}
                                       className={clsx(
                                           "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group relative overflow-hidden hover:shadow-sm",
                                           isSelected 
                                               ? "bg-blue-600 border-blue-600 shadow-md transform scale-[1.01]" 
                                               : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                       )}
                                   >
                                       <div className={clsx(
                                           "flex-shrink-0 w-8 h-8 flex items-center justify-center transition-all duration-200",
                                           isSelected ? "text-white scale-110" : "text-gray-400 group-hover:text-gray-600"
                                       )}>
                                           {currentQuestion.type === 'multiple' 
                                               ? (isSelected ? <CheckSquare size={24} className="text-white" /> : <Square size={24} />)
                                               : (isSelected ? <CheckCircle2 size={24} className="text-white" /> : <Circle size={24} />)
                                           }
                                       </div>
                                       <div className="flex-1 pt-1 min-w-0">
                                           <div className="flex gap-2 items-start">
                                               <span className={clsx("font-bold min-w-[1.5rem] mt-0.5", isSelected ? "text-white" : "text-gray-700")}>{label}.</span>
                                               <div className={clsx("leading-relaxed font-medium prose max-w-none ql-editor !p-0", isSelected ? "text-white prose-invert" : "text-gray-800")} dangerouslySetInnerHTML={{ __html: opt.text }} />
                                           </div>
                                           {opt.image && <img src={opt.image} alt="Opsi" className="mt-3 max-h-40 rounded-lg border border-gray-200 shadow-sm bg-white" />}
                                       </div>
                                   </button>
                               )
                           })}
                       </div>
                   );
               })()}
            </div>

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

        {/* KANAN: GRID */}
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
                                ? "bg-blue-600 text-white border-blue-600 shadow-blue-200" 
                                : isAns 
                                    ? "bg-green-500 text-white border-green-500 hover:bg-green-600 shadow-green-100" 
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
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress.percentage}%` }}></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
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
                  Terdeteksi aktivitas mencurigakan (keluar layar penuh / pindah tab). <br/>
                  <span className="font-bold text-red-600">Sisa toleransi: {3 - warningCount} kali.</span>
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

      {/* CSS Fixes */}
      <style>{`
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block; }
        .ql-editor { height: auto !important; }
        .ql-editor p:first-child { margin-top: 0; }
        .ql-editor p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}