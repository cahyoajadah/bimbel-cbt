// src/pages/admin/Materials.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Video, FileText } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminMaterials() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Fetch materials
  const { data, isLoading } = useQuery({
    queryKey: ['admin-materials', currentPage],
    queryFn: () => adminService.getMaterials({ page: currentPage, per_page: 15 }),
  });

  const materials = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  // Form
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      subject_id: '',
      title: '',
      description: '',
      type: 'video',
      content: '',
      order: 0,
      duration_minutes: '',
      is_active: true,
    },
  });

  const materialType = watch('type');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminService.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      setIsModalOpen(false);
      reset();
      toast.success('Materi berhasil dibuat');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      setIsModalOpen(false);
      setEditingMaterial(null);
      reset();
      toast.success('Materi berhasil diperbarui');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-materials']);
      toast.success('Materi berhasil dihapus');
    },
  });

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      reset({
        subject_id: material.subject_id,
        title: material.title,
        description: material.description || '',
        type: material.type,
        content: material.content || '',
        order: material.order || 0,
        duration_minutes: material.duration_minutes || '',
        is_active: material.is_active,
      });
    } else {
      setEditingMaterial(null);
      reset({
        subject_id: '',
        title: '',
        description: '',
        type: 'video',
        content: '',
        order: 0,
        duration_minutes: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    // Handle file upload for PDF
    if (data.type === 'pdf') {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'pdf_file' && data[key]?.[0]) {
          formData.append('pdf_file', data[key][0]);
        } else if (data[key] !== null && data[key] !== undefined && key !== 'pdf_file') {
          formData.append(key, data[key]);
        }
      });
      
      if (editingMaterial) {
        updateMutation.mutate({ id: editingMaterial.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } else {
      // For video type (YouTube URL)
      if (editingMaterial) {
        updateMutation.mutate({ id: editingMaterial.id, data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const handleDelete = (material) => {
    showConfirm({
      title: 'Hapus Materi',
      message: `Apakah Anda yakin ingin menghapus materi "${material.title}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(material.id),
    });
  };

  const columns = [
    {
      header: 'Judul Materi',
      accessor: 'title',
    },
    {
      header: 'Tipe',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {row.type === 'video' ? (
            <>
              <Video className="w-4 h-4 text-red-600" />
              <span className="text-sm">Video</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm">PDF</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Urutan',
      accessor: 'order',
    },
    {
      header: 'Durasi',
      render: (row) => row.duration_minutes ? `${row.duration_minutes} menit` : '-',
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            row.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
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
            icon={Edit}
            onClick={() => handleOpenModal(row)}
          >
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materi Pembelajaran</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola materi video dan PDF untuk siswa
          </p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Materi
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={materials} loading={isLoading} />
        
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaterial(null);
          reset();
        }}
        title={editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Subject ID"
            type="number"
            required
            error={errors.subject_id?.message}
            {...register('subject_id', { required: 'Subject ID wajib diisi' })}
          />

          <Input
            label="Judul Materi"
            required
            error={errors.title?.message}
            {...register('title', { required: 'Judul wajib diisi' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Materi <span className="text-red-500">*</span>
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('type', { required: true })}
            >
              <option value="video">Video (YouTube)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          {materialType === 'video' ? (
            <Input
              label="Link YouTube"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              required
              error={errors.content?.message}
              {...register('content', { required: 'Link YouTube wajib diisi' })}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PDF <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                {...register('pdf_file')}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Urutan"
              type="number"
              {...register('order')}
            />

            <Input
              label="Durasi (menit)"
              type="number"
              {...register('duration_minutes')}
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
              Materi Aktif
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMaterial(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingMaterial ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}