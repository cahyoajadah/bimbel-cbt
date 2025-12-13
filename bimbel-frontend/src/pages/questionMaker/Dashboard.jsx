import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, AlertCircle, Search, ArrowRight, FolderPlus, MessageSquareWarning, Calendar 
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export default function Dashboard() {
  const navigate = useNavigate();

  // Helper: Cek apakah paket aktif berdasarkan tanggal
  const checkIsActive = (pkg) => {
      const now = new Date();
      
      // 1. Setup Start Date
      let start = null;
      if (pkg.start_date) {
          start = new Date(pkg.start_date);
          start.setHours(0, 0, 0, 0); // Mulai dari awal hari
      }

      // 2. Setup End Date
      let end = null;
      if (pkg.end_date) {
          end = new Date(pkg.end_date);
          end.setHours(23, 59, 59, 999); // Berakhir di akhir hari
      }

      // 3. Logika Fleksibel (Mirip Backend)
      // Aktif jika: (Start Kosong ATAU Start <= Now) DAN (End Kosong ATAU End >= Now)
      const hasStarted = !start || now >= start;
      const hasNotEnded = !end || now <= end;

      return hasStarted && hasNotEnded;
  };

  // Helper: Label Status untuk Tabel
  const getPackageStatusLabel = (pkg) => {
      const now = new Date();
      const start = pkg.start_date ? new Date(pkg.start_date) : null;
      if (start) start.setHours(0, 0, 0, 0);

      const end = pkg.end_date ? new Date(pkg.end_date) : null;
      if (end) end.setHours(23, 59, 59, 999);

      if (start && now < start) {
          return { label: 'Akan Datang', color: 'bg-yellow-100 text-yellow-700' };
      } else if (end && now > end) {
          return { label: 'Selesai', color: 'bg-red-100 text-red-700' };
      } else {
          return { label: 'Tayang', color: 'bg-green-100 text-green-700' };
      }
  };

  // Fetch Dashboard Stats (Real Data)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['qm-dashboard-stats'],
    queryFn: async () => {
      try {
        // 1. Ambil Data Paket
        const packagesRes = await api.get(API_ENDPOINTS.QUESTION_PACKAGES);
        
        // Handle Pagination Data Structure
        const rawData = packagesRes.data.data; 
        const packages = Array.isArray(rawData) ? rawData : (rawData?.data || []);

        // Hitung Paket Aktif (Menggunakan Helper checkIsActive)
        const activePackagesCount = packages.filter(p => checkIsActive(p)).length;

        // 2. Ambil Data Laporan (Pending)
        let pendingReportsCount = 0;
        try {
            // Hardcode URL laporan sementara untuk menghindari error undefined
            const reportsRes = await api.get('/question-maker/reports?status=pending');
            const reportsRaw = reportsRes.data.data;
            const reports = Array.isArray(reportsRaw) ? reportsRaw : (reportsRaw?.data || []);
            pendingReportsCount = reportsRes.data.data.total ?? reports.length;
        } catch (e) {
            console.warn("Gagal ambil laporan:", e);
        }

        return {
          total_packages: packages.length,
          active_packages: activePackagesCount,
          pending_reports: pendingReportsCount,
          recent_packages: packages.slice(0, 5) // Ambil 5 paket terbaru
        };
      } catch (err) {
        console.error("Dashboard Error:", err);
        return { total_packages: 0, active_packages: 0, pending_reports: 0, recent_packages: [] };
      }
    },
  });

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {subtext && <p className={`text-xs mt-2 font-medium ${color.text}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const QuickAction = ({ title, desc, icon: Icon, onClick, color }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 transition-all group text-left w-full h-full"
    >
      <div className={`p-3 rounded-lg mb-3 ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{desc}</p>
    </button>
  );

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Pembuat Soal</h1>
        <p className="text-gray-500">Selamat datang kembali! Apa yang ingin Anda kerjakan hari ini?</p>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Paket Soal" 
          value={stats?.total_packages || 0} 
          icon={Package} 
          color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
          subtext={`${stats?.active_packages || 0} Paket Sedang Tayang`}
        />
        <StatCard 
          title="Laporan Masalah" 
          value={stats?.pending_reports || 0} 
          icon={AlertCircle} 
          color={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
          subtext="Perlu Ditinjau"
        />
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            Aksi Cepat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction 
                title="Kelola Paket Soal" 
                desc="Buat baru, edit tanggal tayang, atau kelola kategori"
                icon={FolderPlus}
                color="bg-blue-600"
                onClick={() => navigate('/question-maker/packages')}
            />
            <QuickAction 
                title="Cek Laporan Siswa" 
                desc="Tinjau masukan kesalahan soal dari siswa"
                icon={MessageSquareWarning}
                color="bg-orange-500"
                onClick={() => navigate('/question-maker/reports')}
            />
        </div>
      </div>

      {/* RECENT PACKAGES TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Paket Soal Terakhir</h3>
            <Link to="/question-maker/packages" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                Lihat Semua <ArrowRight size={16} />
            </Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                        <th className="px-6 py-3">Nama Paket</th>
                        <th className="px-6 py-3">Status Tayang</th>
                        <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {stats?.recent_packages?.length > 0 ? (
                        stats.recent_packages.map((pkg) => {
                            const status = getPackageStatusLabel(pkg);
                            return (
                                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-gray-900">{pkg.name}</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Calendar size={10} />
                                            {pkg.start_date ? new Date(pkg.start_date).toLocaleDateString('id-ID') : '∞'} 
                                            {' - '}
                                            {pkg.end_date ? new Date(pkg.end_date).toLocaleDateString('id-ID') : '∞'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={() => navigate(`/question-maker/packages/${pkg.id}/questions`)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            Kelola Soal
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-gray-400">Belum ada paket soal.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}