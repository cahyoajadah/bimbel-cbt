// ============================================
// src/pages/admin/Feedbacks.jsx
// ============================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminFeedbacks() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-feedbacks', currentPage],
    queryFn: () => adminService.getFeedbacks({ page: currentPage, per_page: 15 }),
  });

  const feedbacks = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      student_id: '',
      month: '',
      content: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: adminService.createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feedbacks']);
      setIsModalOpen(false);
      reset();
      toast.success('Feedback berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feedbacks']);
      setIsModalOpen(false);
      setEditingFeedback(null);
      reset();
      toast.success('Feedback berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feedbacks']);
      toast.success('Feedback berhasil dihapus');
    },
  });

  const handleOpenModal = (feedback = null) => {
    if (feedback) {
      setEditingFeedback(feedback);
      reset({
        student_id: feedback.student_id,
        month: feedback.month,
        content: feedback.content,
      });
    } else {
      setEditingFeedback(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingFeedback) {
      updateMutation.mutate({ id: editingFeedback.id, data: { content: data.content } });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (feedback) => {
    showConfirm({
      title: 'Hapus Feedback',
      message: 'Apakah Anda yakin ingin menghapus feedback ini?',
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(feedback.id),
    });
  };

  const columns = [
    {
      header: 'Siswa',
      render: (row) => row.student?.user?.name || '-',
    },
    {
      header: 'Bulan',
      accessor: 'month',
    },
    {
      header: 'Feedback',
      render: (row) => (
        <div className="max-w-md truncate">{row.content}</div>
      ),
    },
    {
      header: 'Tanggal Dibuat',
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center space-x-2">
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
          <h1 className="text-2xl font-bold text-gray-900">Feedback Siswa</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola evaluasi bulanan untuk siswa</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Feedback
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={feedbacks} loading={isLoading} />
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
          setEditingFeedback(null);
          reset();
        }}
        title={editingFeedback ? 'Edit Feedback' : 'Tambah Feedback Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editingFeedback && (
            <>
              <Input
                label="Student ID"
                type="number"
                required
                error={errors.student_id?.message}
                {...register('student_id', { required: 'Student ID wajib diisi' })}
              />
              <Input
                label="Bulan (Format: YYYY-MM)"
                placeholder="2025-01"
                required
                error={errors.month?.message}
                {...register('month', { 
                  required: 'Bulan wajib diisi',
                  pattern: {
                    value: /^\d{4}-\d{2}$/,
                    message: 'Format harus YYYY-MM'
                  }
                })}
              />
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Isi Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Tulis evaluasi untuk siswa..."
              {...register('content', { required: 'Isi feedback wajib diisi' })}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingFeedback(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingFeedback ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}