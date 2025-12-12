import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Award } from 'lucide-react';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';

export default function PackageRanking() {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['qm-ranking', packageId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PACKAGE_RANKING(packageId));
      return res.data.data;
    },
  });

  const columns = [
    { 
        header: 'Peringkat', 
        accessor: 'rank',
        render: (row) => <span className="font-bold text-center block w-full">#{row.rank}</span>
    },
    { header: 'Nama Siswa', accessor: 'student_name', className: 'font-medium text-gray-900' },
    { header: 'Program', accessor: 'program' },
    { 
        header: 'Skor', 
        accessor: 'score',
        render: (row) => <span className="font-bold text-blue-600">{row.score}</span>
    },
    { 
        header: 'Benar / Salah', 
        render: (row) => (
            <span className="text-xs">
                <span className="text-green-600 font-bold">{row.correct}</span> / 
                <span className="text-red-600 font-bold">{row.wrong}</span>
            </span>
        )
    },
    { header: 'Durasi', accessor: 'duration' },
    { header: 'Waktu Submit', accessor: 'date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/question-maker/packages')}>
                Kembali
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Peringkat Peserta</h1>
                <p className="text-sm text-gray-500">{data?.package_name || 'Memuat...'}</p>
            </div>
        </div>
        <Button variant="outline" icon={Download} onClick={() => alert('Fitur Export CSV akan segera hadir!')}>
            Export Data
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table 
            columns={columns} 
            data={data?.rankings || []} 
            loading={isLoading}
            emptyMessage="Belum ada siswa yang mengerjakan paket ini."
        />
      </div>
    </div>
  );
}