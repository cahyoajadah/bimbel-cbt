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
  answers: {}, // Stores: { qId: optionId } OR { qId: [id1, id2] } OR { qId: "text" }
  
  // Timer
  timeRemaining: 0,
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
      timeRemaining: sessionData.duration_minutes * 60,
      answers: {}, // Load previous answers here if backend supports resume
      currentQuestionIndex: 0,
      warningCount: 0,
    });
    
    sessionStorage.setItem('cbt_session_token', sessionData.session_token);
  },
  
  setCurrentQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },
  
  // Updated to handle various data types (string, array, int)
  saveAnswer: (questionId, answerValue) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answerValue,
      },
    }));
  },
  
  startTimer: (callback) => {
    if (get().timerInterval) return; // Prevent duplicate timers

    const interval = setInterval(() => {
      const newTime = get().timeRemaining - 1;
      
      if (newTime <= 0) {
        clearInterval(get().timerInterval);
        set({ timeRemaining: 0 });
        if (callback) callback();
      } else {
        set({ timeRemaining: newTime });
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
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    sessionStorage.removeItem('cbt_session_token');
    
    set({
      sessionToken: null,
      sessionId: null,
      packageData: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: 0,
      timerInterval: null,
      isFullscreen: true,
      warningCount: 0,
      isSubmitting: false,
      isAutoSaving: false,
    });
  },
  
  // Enhanced Progress Calculation
  getProgress: () => {
    const { questions, answers } = get();
    const totalQuestions = questions.length;
    
    // Hitung jawaban valid saja
    const answeredCount = Object.values(answers).filter(val => {
        if (Array.isArray(val)) return val.length > 0; // Array kosong = belum jawab
        if (typeof val === 'string') return val.trim().length > 0; // Teks kosong = belum jawab
        return val !== null && val !== undefined; // Null = belum jawab
    }).length;

    return {
      total: totalQuestions,
      answered: answeredCount,
      percentage: totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0,
    };
  },
}));