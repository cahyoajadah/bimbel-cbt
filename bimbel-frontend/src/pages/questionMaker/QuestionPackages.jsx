// ============================================
// src/pages/questionMaker/QuestionPackages.jsx
// ============================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function QuestionPackages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['question-packages', currentPage],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.QUESTION_PACKAGES, {
        params: { page: currentPage, per_page: 15 }
      });
      return res.data;
    },
  });

  const packages = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      program_id: '',
      duration_minutes: '',
      passing_score: '',
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.QUESTION_PACKAGES, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      reset();
      toast.success('Paket soal berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      setIsModalOpen(false);
      setEditingPackage(null);
      reset();
      toast.success('Paket soal berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`${API_ENDPOINTS.QUESTION_PACKAGES}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['question-packages']);
      toast.success('Paket soal berhasil dihapus');
    },
  });

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      reset({
        name: pkg.name,
        description: pkg.description || '',
        program_id: pkg.program_id,
        duration_minutes: pkg.duration_minutes,
        passing_score: pkg.passing_score || '',
        is_active: pkg.is_active,
      });
    } else {
      setEditingPackage(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (pkg) => {
    showConfirm({
      title: 'Hapus Paket Soal',
      message: `Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(pkg.id),
    });
  };

  const columns = [
    {
      header: 'Nama Paket',
      accessor: 'name',
    },
    {
      header: 'Program',
      render: (row) => row.program?.name || '-',
    },
    {
      header: 'Jumlah Soal',
      accessor: 'total_questions',
    },
    {
      header: 'Durasi',
      render: (row) => `${row.duration_minutes} menit`,
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          )}
        >
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => navigate(`/question-maker/packages/${row.id}/questions`)}
          >
            Soal
          </Button>
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Soal</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola paket soal tryout</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Paket Soal
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={packages} loading={isLoading} />
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
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPackage(null);
          reset();
        }}
        title={editingPackage ? 'Edit Paket Soal' : 'Tambah Paket Soal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Paket"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Nama paket wajib diisi' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('description')}
            />
          </div>

          <Input
            label="Program ID"
            type="number"
            required
            error={errors.program_id?.message}
            {...register('program_id', { required: 'Program wajib dipilih' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Durasi (menit)"
              type="number"
              required
              error={errors.duration_minutes?.message}
              {...register('duration_minutes', { required: 'Durasi wajib diisi' })}
            />

            <Input
              label="Passing Score"
              type="number"
              step="0.01"
              {...register('passing_score')}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              className="rounded border-gray-300"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Paket Aktif
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPackage(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingPackage ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}