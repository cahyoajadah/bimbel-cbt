// src/pages/admin/Monitoring.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Search, Activity, Eye, MessageSquare, 
    CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function AdminMonitoring() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // 1. FETCH STUDENTS LIST
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['admin-students-monitoring', currentPage, search],
    queryFn: async () => (await api.get(`/admin/students?page=${currentPage}&per_page=10&search=${search}`)).data,
  });

  const students = studentsData?.data?.data || [];
  const pagination = studentsData?.data;

  // 2. FETCH DETAIL PROGRESS
  const { data: progressDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['student-progress-detail', selectedStudent?.id],
    queryFn: async () => (await api.get(`/admin/students/${selectedStudent.id}/progress-detail`)).data.data,
    enabled: !!selectedStudent && isDetailOpen, 
  });

  // 3. FETCH RIWAYAT FEEDBACK
  const { data: feedbackHistory, isLoading: isLoadingFeedbacks } = useQuery({
    queryKey: ['admin-student-feedbacks', selectedStudent?.id],
    queryFn: async () => (await api.get(`/admin/feedbacks?student_id=${selectedStudent.id}`)).data,
    enabled: !!selectedStudent && isDetailOpen,
  });

  const feedbacks = feedbackHistory?.data?.data || [];

  // 4. FORM FEEDBACK
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const feedbackMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/admin/feedbacks', {
        student_id: selectedStudent.id,
        content: data.content,
        month: new Date().toISOString().slice(0, 7), 
      });
    },
    onSuccess: () => {
      setIsFeedbackOpen(false);
      reset();
      toast.success('Feedback berhasil dikirim ke siswa');
      queryClient.invalidateQueries(['admin-student-feedbacks']); 
    },
    onError: (err) => toast.error('Gagal mengirim feedback')
  });

  const handleViewDetail = (student) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const handleOpenFeedback = (student) => {
    setSelectedStudent(student);
    setIsFeedbackOpen(true);
    reset();
  };

  const onSubmitFeedback = (data) => {
    feedbackMutation.mutate(data);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // [PERBAIKAN] Menggunakan persentase lebar (w-[...]) agar tabel seimbang
  const columns = [
    { 
        header: 'Siswa', 
        className: 'w-[35%]', // Porsi terbesar untuk nama siswa
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                    {row.user?.name?.charAt(0)}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{row.user?.name}</div>
                    <div className="text-xs text-gray-500">{row.student_number}</div>
                </div>
            </div>
        ) 
    },
    { 
        header: 'Asal Sekolah', 
        accessor: 'school',
        className: 'w-[25%]' // Porsi sedang
    },
    { 
        header: 'Program', 
        className: 'w-[25%]', // Porsi sedang
        render: (row) => (
            <div className="flex flex-wrap gap-1">
                {row.programs?.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                        {p.name}
                    </span>
                ))}
            </div>
        )
    },
    {
      header: 'Aksi',
      className: 'w-[15%]', // Porsi pas untuk tombol (tidak terlalu lebar, tidak terlalu sempit)
      render: (row) => (
        <div className="flex items-center gap-2"> 
          <Button size="sm" variant="outline" icon={Eye} onClick={() => handleViewDetail(row)}>
            Detail
          </Button>
          <Button size="sm" icon={MessageSquare} onClick={() => handleOpenFeedback(row)}>
            Feedback
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Monitoring Siswa</h1>
            <p className="text-sm text-gray-600 mt-1">Pantau perkembangan dan berikan evaluasi belajar.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari siswa..." 
            className="flex-1 border-none focus:ring-0 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={students} loading={isLoading} />
        {pagination && (
          <Pagination 
            currentPage={pagination.current_page || 1} 
            totalPages={pagination.last_page || 1} 
            onPageChange={setCurrentPage} 
            perPage={pagination.per_page || 10} 
            total={pagination.total || 0} 
          />
        )}
      </div>

      {/* MODAL DETAIL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Progress Belajar: ${selectedStudent?.user?.name}`}
        size="xl" 
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingDetail ? (
                <div className="p-10 text-center text-gray-500">Memuat data progress...</div>
            ) : progressDetail ? (
                <div className="space-y-8">
                    {/* STATISTIK */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                            <div className="text-blue-500 mb-2 flex justify-center"><CheckCircle size={24}/></div>
                            <div className="text-2xl font-bold text-gray-800">{progressDetail.attendance_count || 0}</div>
                            <div className="text-xs text-gray-600">Total Kehadiran</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                            <div className="text-green-500 mb-2 flex justify-center"><Activity size={24}/></div>
                            <div className="text-2xl font-bold text-gray-800">{progressDetail.average_score || 0}</div>
                            <div className="text-xs text-gray-600">Rata-rata Nilai</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                            <div className="text-purple-500 mb-2 flex justify-center"><Clock size={24}/></div>
                            <div className="text-2xl font-bold text-gray-800">{progressDetail.completed_materials || 0}</div>
                            <div className="text-xs text-gray-600">Materi Selesai</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* RIWAYAT TRYOUT */}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Activity size={18} className="text-blue-600"/> Riwayat Tryout Terakhir
                            </h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                {progressDetail.recent_tryouts?.length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600">
                                            <tr>
                                                <th className="p-3 font-medium">Tanggal</th>
                                                <th className="p-3 font-medium">Paket</th>
                                                <th className="p-3 text-right font-medium">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {progressDetail.recent_tryouts.map((to, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3 text-gray-600">{to.date}</td>
                                                    <td className="p-3 font-medium text-gray-800">{to.package_name}</td>
                                                    <td className="p-3 text-right font-bold text-blue-600">{to.total_score}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-6 text-center text-gray-500 text-sm">Belum ada riwayat tryout.</div>
                                )}
                            </div>
                        </div>

                        {/* RIWAYAT FEEDBACK */}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <MessageSquare size={18} className="text-orange-600"/> Riwayat Feedback Admin
                            </h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 h-[250px] overflow-y-auto p-3 space-y-3">
                                {isLoadingFeedbacks ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Memuat feedback...</div>
                                ) : feedbacks.length > 0 ? (
                                    feedbacks.map((fb) => (
                                        <div key={fb.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">
                                                        {fb.admin?.name?.charAt(0) || 'A'}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{fb.admin?.name || 'Admin'}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {formatDate(fb.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                                {fb.content}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                        <MessageSquare size={32} className="mb-2 opacity-20"/>
                                        <p>Belum ada feedback yang diberikan.</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-right">
                                <button 
                                    onClick={() => { setIsDetailOpen(false); handleOpenFeedback(selectedStudent); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                >
                                    + Tambah Feedback Baru
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-red-500">Gagal memuat data progress.</div>
            )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Tutup</Button>
        </div>
      </Modal>

      {/* MODAL FORM FEEDBACK */}
      <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Berikan Evaluasi / Feedback">
        <form onSubmit={handleSubmit(onSubmitFeedback)} className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-3">
                <AlertCircle className="text-yellow-600 shrink-0" size={20} />
                <p className="text-sm text-yellow-700">Pesan ini akan muncul di dashboard siswa sebagai evaluasi bulanan/mingguan.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan Evaluasi</label>
                <textarea 
                    rows={5} 
                    placeholder="Contoh: Pertahankan nilai matematikamu, namun perlu peningkatan di sesi Bahasa Inggris..."
                    className="w-full border-gray-300 rounded-lg p-3 border focus:ring-blue-500 focus:border-blue-500 text-sm" 
                    {...register('content', { required: "Isi pesan tidak boleh kosong" })}
                ></textarea>
                {errors.content && <span className="text-red-500 text-xs mt-1">{errors.content.message}</span>}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFeedbackOpen(false)}>Batal</Button>
                <Button type="submit" loading={feedbackMutation.isPending}>Kirim Evaluasi</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}