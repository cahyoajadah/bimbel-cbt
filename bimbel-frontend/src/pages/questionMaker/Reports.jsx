import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Search, Check } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function QuestionReports() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseText, setResponseText] = useState('');

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['question-reports', currentPage],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_REPORTS + `?page=${currentPage}`);
      return res.data.data;
    },
  });

  const reports = reportsData?.data || [];
  const pagination = reportsData;

  const respondMutation = useMutation({
    mutationFn: async ({ id, admin_response, status }) => {
      const res = await api.post(API_ENDPOINTS.REPORT_RESPOND(id), { 
          admin_response, 
          status 
      });
      return res.data;
    },
    onSuccess: () => {
      // [PERBAIKAN] Update list tabel DAN update notifikasi di Header
      queryClient.invalidateQueries(['question-reports']);
      queryClient.invalidateQueries(['pending-reports']); 
      
      handleCloseModal();
      toast.success('Laporan ditandai selesai');
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Gagal memproses laporan');
    }
  });

  const handleOpenModal = (report) => {
      setSelectedReport(report);
      setResponseText(report.admin_response || ''); 
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedReport(null);
  };

  const handleSubmitResponse = () => {
      respondMutation.mutate({ 
          id: selectedReport.id, 
          admin_response: responseText || 'Masalah telah diperbaiki.', 
          status: 'resolved'
      });
  };

  const columns = [
    { 
        header: 'Status', 
        render: (row) => (
            <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1",
                row.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            )}>
                {row.status === 'resolved' ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                {row.status === 'resolved' ? 'Selesai' : 'Pending'}
            </span>
        )
    },
    { 
        header: 'Pelapor', 
        render: (row) => (
            <div>
                <div className="font-medium text-gray-900">{row.student?.user?.name || 'Siswa'}</div>
                <div className="text-xs text-gray-500">{new Date(row.created_at).toLocaleDateString('id-ID')}</div>
            </div>
        )
    },
    { 
        header: 'Soal Terkait', 
        render: (row) => (
            <div className="max-w-xs truncate text-sm text-gray-600" title={row.question?.question_text}>
                {row.question?.question_text || 'Soal dihapus'}
            </div>
        )
    },
    { 
        header: 'Isi Laporan', 
        render: (row) => <div className="text-sm italic text-red-600 line-clamp-2">{row.report_content}</div> 
    },
    {
        header: 'Aksi',
        render: (row) => (
            <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleOpenModal(row)}
                disabled={row.status === 'resolved'}
            >
                {row.status === 'resolved' ? 'Lihat' : 'Tindak Lanjut'}
            </Button>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan Soal</h1>
            <p className="text-sm text-gray-600">Daftar aduan siswa mengenai kesalahan soal.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={reports} loading={isLoading} />
        {pagination && (
          <Pagination 
            currentPage={pagination.current_page || 1} 
            totalPages={pagination.last_page || 1} 
            onPageChange={setCurrentPage} 
            perPage={pagination.per_page || 15} 
            total={pagination.total || 0} 
          />
        )}
      </div>

      <Modal 
         isOpen={isModalOpen} 
         onClose={handleCloseModal} 
         title="Detail Laporan"
         size="lg"
      >
         {selectedReport && (
             <div className="space-y-6">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Soal yang Dilaporkan</h4>
                     <p className="text-gray-800 whitespace-pre-wrap mb-4">{selectedReport.question?.question_text}</p>
                     {selectedReport.question?.question_image && (
                         <img src={selectedReport.question.question_image} className="max-h-48 rounded border" alt="Soal" />
                     )}
                 </div>

                 <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                     <h4 className="text-xs font-bold text-red-600 uppercase mb-1">Keluhan Siswa ({selectedReport.student?.user?.name})</h4>
                     <p className="text-red-800 font-medium">{selectedReport.report_content}</p>
                 </div>

                 {selectedReport.status !== 'resolved' ? (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Perbaikan (Opsional)</label>
                        <textarea 
                            className="w-full border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Tulis tindakan yang diambil (misal: Kunci jawaban sudah diperbaiki)"
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                        ></textarea>
                     </div>
                 ) : (
                     <div className="bg-green-50 p-3 rounded text-green-800 text-sm flex items-center gap-2">
                         <CheckCircle size={16} /> 
                         <div>
                             <strong>Laporan Selesai</strong>
                             <p className="text-xs mt-1">{selectedReport.admin_response}</p>
                         </div>
                     </div>
                 )}

                 <div className="flex justify-end gap-3 pt-4 border-t">
                     <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
                     {selectedReport.status !== 'resolved' && (
                        <Button onClick={handleSubmitResponse} loading={respondMutation.isPending}>
                            <Check size={16} className="mr-2" />
                            Tandai Selesai
                        </Button>
                     )}
                 </div>
             </div>
         )}
      </Modal>
    </div>
  );
}