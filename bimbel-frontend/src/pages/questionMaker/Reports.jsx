// ============================================
// src/pages/questionMaker/Reports.jsx
// ============================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function QuestionReports() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('reviewed');

  const { data, isLoading } = useQuery({
    queryKey: ['question-reports', currentPage],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_REPORTS, {
        params: { page: currentPage, per_page: 15 }
      });
      return res.data;
    },
  });

  const reports = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const respondMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.post(API_ENDPOINTS.REPORT_RESPOND(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-reports']);
      setSelectedReport(null);
      setResponse('');
      toast.success('Respon berhasil dikirim');
    },
  });

  const handleRespond = () => {
    if (!response.trim()) {
      toast.error('Respon tidak boleh kosong');
      return;
    }

    respondMutation.mutate({
      id: selectedReport.id,
      data: {
        admin_response: response,
        status: status,
      },
    });
  };

  const columns = [
    {
      header: 'Pelapor',
      render: (row) => row.student?.user?.name || '-',
    },
    {
      header: 'Soal',
      render: (row) => (
        <div className="max-w-xs truncate">
          {row.question?.question_text || '-'}
        </div>
      ),
    },
    {
      header: 'Paket Soal',
      render: (row) => row.question?.question_package?.name || '-',
    },
    {
      header: 'Isi Laporan',
      render: (row) => (
        <div className="max-w-md truncate">{row.report_content}</div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            row.status === 'pending' && 'bg-yellow-100 text-yellow-800',
            row.status === 'reviewed' && 'bg-blue-100 text-blue-800',
            row.status === 'resolved' && 'bg-green-100 text-green-800'
          )}
        >
          {row.status === 'pending' && 'Pending'}
          {row.status === 'reviewed' && 'Direview'}
          {row.status === 'resolved' && 'Selesai'}
        </span>
      ),
    },
    {
      header: 'Tanggal',
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Aksi',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          icon={MessageSquare}
          onClick={() => {
            setSelectedReport(row);
            setResponse(row.admin_response || '');
            setStatus(row.status === 'pending' ? 'reviewed' : row.status);
          }}
        >
          Respon
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaduan Soal</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lihat dan tanggapi laporan dari siswa
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={reports} loading={isLoading} />
        {pagination && (
          <Pagination
            currentPage={pagination.current_page || currentPage}
            totalPages={pagination.last_page || 1}
            onPageChange={setCurrentPage}
            perPage={pagination.per_page || 15}
            total={pagination.total || 0}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          setResponse('');
        }}
        title="Respon Pengaduan"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Detail Laporan</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Pelapor:</span> {selectedReport.student?.user?.name}</p>
                <p><span className="font-medium">Soal:</span> {selectedReport.question?.question_text?.substring(0, 100)}...</p>
                <p><span className="font-medium">Isi Laporan:</span></p>
                <p className="text-gray-700">{selectedReport.report_content}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respon Anda <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Tulis respon Anda..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="reviewed">Direview</option>
                <option value="resolved">Selesai</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setResponse('');
                }}
              >
                Batal
              </Button>
              <Button
                icon={Send}
                onClick={handleRespond}
                loading={respondMutation.isPending}
              >
                Kirim Respon
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}