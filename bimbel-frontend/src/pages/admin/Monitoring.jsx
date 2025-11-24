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

  // 3. FORM FEEDBACK
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const feedbackMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/admin/feedbacks', {
        student_id: selectedStudent.id,
        content: data.content,
        month: new Date().toISOString().slice(0, 7), // Format YYYY-MM otomatis
      });
    },
    onSuccess: () => {
      setIsFeedbackOpen(false);
      reset();
      toast.success('Feedback berhasil dikirim ke siswa');
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

  const columns = [
    { 
        header: 'Siswa', 
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {row.user?.name?.charAt(0)}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{row.user?.name}</div>
                    <div className="text-xs text-gray-500">{row.student_number}</div>
                </div>
            </div>
        ) 
    },
    { header: 'Asal Sekolah', accessor: 'school' },
    { 
        header: 'Program', 
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
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" icon={Eye} onClick={() => handleViewDetail(row)}>
            Detail
          </Button>
          <Button size="sm" icon={MessageSquare} onClick={() => handleOpenFeedback(row)}>
            Beri Feedback
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
        size="lg"
      >
        {isLoadingDetail ? (
            <div className="p-10 text-center text-gray-500">Memuat data progress...</div>
        ) : progressDetail ? (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
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

                <div>
                    <h4 className="font-bold text-gray-800 mb-3">Riwayat Tryout Terakhir</h4>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        {progressDetail.recent_tryouts?.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3">Paket Soal</th>
                                        <th className="p-3 text-right">Nilai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {progressDetail.recent_tryouts.map((to, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3">{to.date}</td>
                                            <td className="p-3 font-medium">{to.package_name}</td>
                                            <td className="p-3 text-right font-bold text-blue-600">{to.total_score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">Belum ada riwayat tryout.</div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="p-4 text-center text-red-500">Gagal memuat data.</div>
        )}
        <div className="mt-6 flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Tutup</Button></div>
      </Modal>

      {/* MODAL FEEDBACK */}
      <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Berikan Evaluasi / Feedback">
        <form onSubmit={handleSubmit(onSubmitFeedback)} className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-3">
                <AlertCircle className="text-yellow-600 shrink-0" size={20} />
                <p className="text-sm text-yellow-700">Pesan ini akan muncul di dashboard siswa.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                <textarea rows={5} className="w-full border-gray-300 rounded-lg p-3 border" {...register('content', { required: true })}></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFeedbackOpen(false)}>Batal</Button>
                <Button type="submit" loading={feedbackMutation.isPending}>Kirim</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}