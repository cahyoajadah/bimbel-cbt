// src/pages/student/CBT.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCBTStore } from '../../store/cbtStore';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import screenfull from 'screenfull';

export default function CBT() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [isExiting, setIsExiting] = useState(false);
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    warningCount,
    isFullscreen,
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

  // Fetch questions
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['cbt-questions', sessionId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.CBT_QUESTIONS);
      return res.data.data;
    },
    enabled: !!sessionId,
  });

  // Auto-save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answerOptionId }) => {
      const res = await api.post(API_ENDPOINTS.CBT_ANSWER, {
        question_id: questionId,
        answer_option_id: answerOptionId,
      });
      return res.data;
    },
    onSuccess: () => {
      setAutoSaving(false);
    },
    onError: () => {
      setAutoSaving(false);
      toast.error('Gagal menyimpan jawaban');
    },
  });

  // Fullscreen warning mutation
  const fullscreenWarningMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(API_ENDPOINTS.CBT_FULLSCREEN_WARNING);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.auto_submit) {
        toast.error('Tryout otomatis di-submit karena keluar fullscreen 3x');
        handleSubmit();
      }
    },
  });

  // Submit tryout mutation
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
      
      toast.success('Tryout berhasil di-submit!');
      navigate(`/student/tryout-review/${resultId}`);
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  // Initialize timer
  useEffect(() => {
    if (timeRemaining > 0 && questions.length > 0) {
      startTimer(() => {
        toast.error('Waktu habis! Tryout otomatis di-submit.');
        handleSubmit();
      });
    }

    return () => {
      stopTimer();
    };
  }, []);

  // Fullscreen handling
  useEffect(() => {
    const enterFullscreen = async () => {
      if (screenfull.isEnabled) {
        try {
          await screenfull.request();
          setFullscreen(true);
        } catch (err) {
          console.error('Fullscreen error:', err);
        }
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (screenfull.isEnabled) {
        const isNowFullscreen = screenfull.isFullscreen;
        setFullscreen(isNowFullscreen);

        if (!isNowFullscreen && !isExiting) {
          incrementWarning();
          fullscreenWarningMutation.mutate();
          toast.error(`Peringatan ${warningCount + 1}/3: Jangan keluar dari fullscreen!`);
        }
      }
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleFullscreenChange);
      }
    };
  }, [warningCount, isExiting]);

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Klik kanan dinonaktifkan');
    };

    const handleKeyDown = (e) => {
      // Disable Ctrl+C, Ctrl+U, Ctrl+S, F12, PrintScreen
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        toast.error('Shortcut keyboard dinonaktifkan');
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      toast.error('Copy text dinonaktifkan');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId, optionId) => {
    saveAnswer(questionId, optionId);
    setAutoSaving(true);
    saveAnswerMutation.mutate({ questionId, answerOptionId: optionId });
  }, []);

  // Handle submit
  const handleSubmit = () => {
    setIsExiting(true);
    setSubmitting(true);
    submitMutation.mutate();
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat soal...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Tidak ada soal tersedia</p>
          <Button className="mt-4" onClick={() => navigate('/student/tryouts')}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Timer */}
            <div className="flex items-center space-x-3">
              <Clock className={clsx(
                'w-6 h-6',
                timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'
              )} />
              <span className={clsx(
                'text-lg font-mono font-bold',
                timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Progress */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Soal {currentQuestionIndex + 1} dari {questions.length}
              </p>
              <div className="mt-1 w-48 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(progress.answered / progress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Warning & Submit */}
            <div className="flex items-center space-x-4">
              {warningCount > 0 && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    Peringatan: {warningCount}/3
                  </span>
                </div>
              )}
              
              <Button
                variant="success"
                onClick={handleSubmit}
                loading={submitMutation.isPending}
              >
                Submit Tryout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Soal No. {currentQuestion.order_number}
                </h2>
                <span className="text-sm text-gray-500">
                  {currentQuestion.duration_seconds} detik | {currentQuestion.point || 5} poin
                </span>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {currentQuestion.question_text}
                </p>
                {currentQuestion.question_image && (
                  <img
                    src={currentQuestion.question_image}
                    alt="Soal"
                    className="mt-4 max-w-full rounded"
                  />
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                      className={clsx(
                        'w-full text-left p-4 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start">
                        <div className={clsx(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        )}>
                          {option.label}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{option.text}</p>
                          {option.image && (
                            <img
                              src={option.image}
                              alt={`Opsi ${option.label}`}
                              className="mt-2 max-w-xs rounded"
                            />
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="flex-shrink-0 w-6 h-6 text-blue-600 ml-3" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Soal Sebelumnya
              </Button>
              
              <Button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Soal Selanjutnya
              </Button>
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">
                Navigasi Soal
              </h3>
              
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={clsx(
                        'w-10 h-10 rounded-lg font-medium text-sm transition-all',
                        isCurrent && 'ring-2 ring-blue-600 ring-offset-2',
                        isAnswered
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-gray-600">Terjawab ({progress.answered})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                  <span className="text-gray-600">
                    Belum Terjawab ({progress.total - progress.answered})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}