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
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      
      <div className={clsx(
        'transition-all duration-300',
        'lg:pl-64'
      )}>
        <Header />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;