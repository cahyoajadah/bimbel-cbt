// src/pages/questionMaker/Reports.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input'; // Pastikan ada atau ganti dengan textarea biasa
import toast from 'react-hot-toast';

export default function Reports() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  // Fetch Data Laporan
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['question-reports', filterStatus],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.QUESTION_REPORTS}?status=${filterStatus}`);
      return res.data.data;
    },
  });

  const reports = reportsData?.data || []; // Handle pagination structure

  // Mutation untuk merespon laporan
  const respondMutation = useMutation({
    mutationFn: ({ id, status, response }) => {
      return api.post(`${API_ENDPOINTS.QUESTION_REPORTS}/${id}/respond`, { status, response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-reports']);
      setIsModalOpen(false);
      setResponseText('');
      toast.success('Laporan berhasil ditangani');
    },
    onError: () => toast.error('Gagal memperbarui laporan'),
  });

  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setResponseText(report.admin_response || '');
    setIsModalOpen(true);
  };

  const handleSubmitResponse = (status) => {
    if (!responseText && status === 'rejected') {
        return toast.error('Berikan alasan penolakan');
    }
    respondMutation.mutate({ 
        id: selectedReport.id, 
        status, 
        response: responseText 
    });
  };

  // [FIX] Fungsi untuk menghapus Tag HTML (Strip HTML)
  const stripHtml = (html) => {
     if (!html) return "-";
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  const columns = [
    { 
      header: 'Status', 
      render: (row) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700',
            resolved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${colors[row.status] || 'bg-gray-100'}`}>
                {row.status}
            </span>
        );
      }
    },
    { 
      header: 'Pelapor', 
      render: (row) => (
        <div>
            <div className="font-medium text-gray-900">{row.student?.user?.name || 'Siswa'}</div>
            <div className="text-xs text-gray-500">{new Date(row.created_at).toLocaleDateString()}</div>
        </div>
      )
    },
    { 
      header: 'Soal Terkait', 
      render: (row) => (
         // [FIX] Terapkan stripHtml di sini
         <div className="max-w-xs truncate text-sm text-gray-600" title={stripHtml(row.question?.question_text)}>
            {stripHtml(row.question?.question_text)}
         </div>
      ) 
    },
    { 
      header: 'Isi Laporan', 
      render: (row) => (
         <div className="max-w-xs truncate text-sm italic text-red-500">
            "{row.report_content}"
         </div>
      ) 
    },
    {
      header: 'Aksi',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            <Eye size={16} className="mr-2" /> Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Soal</h1>
            <p className="text-gray-500">Daftar aduan siswa mengenai kesalahan soal.</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {['pending', 'resolved', 'rejected'].map(status => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        filterStatus === status ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={reports} loading={isLoading} emptyMessage="Tidak ada laporan." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detail Laporan">
        {selectedReport && (
            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Soal yang dilaporkan</h4>
                    {/* [FIX] Tampilkan Soal Full dengan HTML rendering yang aman (untuk detail) */}
                    <div 
                        className="prose prose-sm max-w-none bg-white p-3 rounded border border-gray-100"
                        dangerouslySetInnerHTML={{ __html: selectedReport.question?.question_text }} 
                    />
                </div>

                <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Isi Laporan Siswa</h4>
                    <p className="text-gray-800 bg-red-50 p-3 rounded border border-red-100">
                        {selectedReport.report_content}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggapan Admin</label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="4"
                        placeholder="Tulis tanggapan atau tindakan yang diambil..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        disabled={selectedReport.status !== 'pending'}
                    />
                </div>

                {selectedReport.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                        <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => handleSubmitResponse('rejected')}
                            loading={respondMutation.isPending}
                        >
                            <XCircle size={18} className="mr-2" /> Tolak Laporan
                        </Button>
                        <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                            onClick={() => handleSubmitResponse('resolved')}
                            loading={respondMutation.isPending}
                        >
                            <CheckCircle size={18} className="mr-2" /> Soal Diperbaiki
                        </Button>
                    </div>
                )}
            </div>
        )}
      </Modal>
    </div>
  );
}