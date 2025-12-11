// ============================================
// src/store/cbtStore.js
// ============================================
import { create } from 'zustand';

export const useCBTStore = create((set, get) => ({
  // Session data
  sessionToken: null,
  sessionId: null,
  packageData: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {}, 
  
  // Timer State
  timeRemaining: 0,
  endTime: null, // [BARU] Menyimpan waktu selesai absolut (Timestamp)
  timerInterval: null,
  
  // Fullscreen & Security
  isFullscreen: true,
  warningCount: 0,
  
  // Status
  isSubmitting: false,
  isAutoSaving: false,
  
  // Actions
  initSession: (sessionData, questions) => {
    set({
      sessionToken: sessionData.session_token,
      sessionId: sessionData.session_id,
      packageData: sessionData.package,
      questions: questions,
      // Init awal, setTimer akan dipanggil ulang oleh komponen untuk sinkronisasi presisi
      timeRemaining: sessionData.duration_minutes * 60,
      answers: {}, 
      currentQuestionIndex: 0,
      warningCount: 0,
    });
    
    sessionStorage.setItem('cbt_session_token', sessionData.session_token);
  },

  setQuestions: (questions) => {
    set({ questions });
  },

  // [PERBAIKAN] Set timer berdasarkan target waktu selesai
  setTimer: (seconds) => {
    const now = Date.now();
    const endTime = now + (seconds * 1000);
    set({ 
        timeRemaining: seconds,
        endTime: endTime // Simpan deadline di state
    });
  },
  
  setCurrentQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },
  
  saveAnswer: (questionId, answerValue) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answerValue,
      },
    }));
  },
  
  // [PERBAIKAN] Logic timer menghitung selisih waktu (Anti-Freeze & Background Support)
  startTimer: (callback) => {
    if (get().timerInterval) return; 

    // Pastikan endTime ada, jika tidak, buat baru berdasarkan timeRemaining saat ini
    let { endTime, timeRemaining } = get();
    if (!endTime && timeRemaining > 0) {
        endTime = Date.now() + (timeRemaining * 1000);
        set({ endTime });
    }

    const interval = setInterval(() => {
      const { endTime } = get();
      if (!endTime) return;

      const now = Date.now();
      // Hitung selisih waktu nyata
      const diff = Math.ceil((endTime - now) / 1000);
      
      if (diff <= 0) {
        clearInterval(get().timerInterval);
        set({ timeRemaining: 0, timerInterval: null });
        if (callback) callback();
      } else {
        // Update UI dengan selisih waktu yang akurat
        set({ timeRemaining: diff });
      }
    }, 1000);
    
    set({ timerInterval: interval });
  },
  
  stopTimer: () => {
    if (get().timerInterval) {
      clearInterval(get().timerInterval);
      set({ timerInterval: null });
    }
  },
  
  incrementWarning: () => {
    set((state) => ({ warningCount: state.warningCount + 1 }));
  },
  
  setFullscreen: (isFullscreen) => {
    set({ isFullscreen });
  },
  
  setSubmitting: (isSubmitting) => {
    set({ isSubmitting });
  },
  
  setAutoSaving: (isAutoSaving) => {
    set({ isAutoSaving });
  },
  
  resetSession: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    
    sessionStorage.removeItem('cbt_session_token');
    
    set({
      sessionToken: null,
      sessionId: null,
      packageData: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: 0,
      endTime: null, // Reset endTime
      timerInterval: null,
      isFullscreen: true,
      warningCount: 0,
      isSubmitting: false,
      isAutoSaving: false,
    });
  },
  
  getProgress: () => {
    const { questions, answers } = get();
    const totalQuestions = questions?.length || 0;
    
    const answeredCount = Object.values(answers).filter(val => {
        if (Array.isArray(val)) return val.length > 0; 
        if (typeof val === 'string') return val.trim().length > 0;
        return val !== null && val !== undefined; 
    }).length;

    return {
      total: totalQuestions,
      answered: answeredCount,
      percentage: totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0,
    };
  },
}));