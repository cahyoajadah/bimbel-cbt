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
  
  // Timer
  timeRemaining: 0,
  timerInterval: null,
  
  // Fullscreen
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
      timeRemaining: sessionData.duration_minutes * 60, // Convert to seconds
      answers: {},
      currentQuestionIndex: 0,
      warningCount: 0,
    });
    
    // Save session token to sessionStorage
    sessionStorage.setItem('cbt_session_token', sessionData.session_token);
  },
  
  setCurrentQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },
  
  saveAnswer: (questionId, optionId) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: optionId,
      },
    }));
  },
  
  startTimer: (callback) => {
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
  
  // Computed values
  getProgress: () => {
    const { questions, answers } = get();
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    return {
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  },
}));