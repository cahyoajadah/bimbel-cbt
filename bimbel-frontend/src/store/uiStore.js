// ============================================
// src/store/uiStore.js
// ============================================
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modal
  modals: {},
  openModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: true }
  })),
  closeModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: false }
  })),
  
  // Loading states
  loadingStates: {},
  setLoading: (key, isLoading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: isLoading }
  })),
  
  // Confirm dialog
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    type: 'warning', // 'warning', 'danger', 'info'
  },
  
  showConfirm: (config) => set({
    confirmDialog: {
      isOpen: true,
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || 'Konfirmasi',
      cancelText: config.cancelText || 'Batal',
      type: config.type || 'warning',
    },
  }),
  
  closeConfirm: () => set((state) => ({
    confirmDialog: { ...state.confirmDialog, isOpen: false }
  })),
}));