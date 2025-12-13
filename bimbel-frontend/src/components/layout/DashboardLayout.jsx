// ============================================
// src/components/layout/DashboardLayout.jsx
// ============================================
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

export const DashboardLayout = ({ children, role }) => {
  const { sidebarOpen } = useUIStore();

  return (
    // UBAH 1: Background diubah dari abu-abu solid menjadi gradien halus
    // agar elemen yang mengapung terlihat lebih dimensi.
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 font-sans antialiased overflow-x-hidden">
      <Sidebar role={role} />

      {/* Main Content Wrapper */}
      <div className={clsx(
        'transition-all duration-300 ease-in-out min-h-screen flex flex-col',
        // Sidebar width + margin adjustment
        'lg:pl-[calc(16rem+1rem)]' 
      )}>
        <Header />
        
        {/* UBAH 2: Padding atas disesuaikan karena header sekarang mengapung & punya margin */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:pt-6 overflow-y-auto">
          {/* Container untuk membatasi lebar konten agar rapi di layar besar */}
          <div className="max-w-7xl mx-auto w-full h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// [FIX] Tambahkan baris ini agar bisa di-import sebagai default di AppRoutes.jsx
export default DashboardLayout;