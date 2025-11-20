// src/pages/admin/Schedules.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { adminService } from '../../api/services/adminService';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-schedules', currentPage],
    queryFn: () => adminService.getSchedules({ page: currentPage, per_page: 15 }),
  });

  const schedules = data?.data?.data || [];
  const pagination = data?.data?.meta || data?.data;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      type: 'class',
      class_type: 'zoom',
      program_id: '',
      teacher_id: '',
      start_time: '',
      end_time: '',
      zoom_link: '',
      location: '',
      max_participants: '',
      is_active: true,
    },
  });

  const scheduleType = watch('type');
  const classType = watch('class_type');

  const createMutation = useMutation({
    mutationFn: adminService.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      setIsModalOpen(false);
      reset();
      toast.success('Jadwal berhasil dibuat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      setIsModalOpen(false);
      setEditingSchedule(null);
      reset();
      toast.success('Jadwal berhasil diperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      toast.success('Jadwal berhasil dihapus');
    },
  });

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      reset({
        title: schedule.title,
        description: schedule.description || '',
        type: schedule.type,
        class_type: schedule.class_type || 'zoom',
        program_id: schedule.program_id || '',
        teacher_id: schedule.teacher_id || '',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        zoom_link: schedule.zoom_link || '',
        location: schedule.location || '',
        max_participants: schedule.max_participants || '',
        is_active: schedule.is_active,
      });
    } else {
      setEditingSchedule(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (schedule) => {
    showConfirm({
      title: 'Hapus Jadwal',
      message: `Apakah Anda yakin ingin menghapus jadwal "${schedule.title}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(schedule.id),
    });
  };

  const columns = [
    {
      header: 'Judul',
      accessor: 'title',
    },
    {
      header: 'Tipe',
      render: (row) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full',
          row.type === 'tryout' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        )}>
          {row.type === 'tryout' ? 'Tryout' : 'Kelas'}
        </span>
      ),
    },
    {
      header: 'Waktu Mulai',
      render: (row) => formatDateTime(row.start_time),
    },
    {
      header: 'Waktu Selesai',
      render: (row) => formatDateTime(row.end_time),
    },
    {
      header: 'Tipe Kelas',
      render: (row) => row.class_type ? (
        <span className="text-sm capitalize">{row.class_type}</span>
      ) : '-',
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full',
          row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        )}>
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
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
          <h1 className="text-2xl font-bold text-gray-900">Jadwal</h1>
          <p className="mt-1 text-sm text-gray-600">Kelola jadwal kelas dan tryout</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Tambah Jadwal
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={schedules} loading={isLoading} />
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
          setEditingSchedule(null);
          reset();
        }}
        title={editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Judul"
            required
            error={errors.title?.message}
            {...register('title', { required: 'Judul wajib diisi' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                {...register('type', { required: true })}
              >
                <option value="class">Kelas</option>
                <option value="tryout">Tryout</option>
              </select>
            </div>

            {scheduleType === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                  {...register('class_type')}
                >
                  <option value="zoom">Zoom</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Waktu Mulai"
              type="datetime-local"
              required
              {...register('start_time', { required: 'Waktu mulai wajib diisi' })}
            />
            <Input
              label="Waktu Selesai"
              type="datetime-local"
              required
              {...register('end_time', { required: 'Waktu selesai wajib diisi' })}
            />
          </div>

          {scheduleType === 'class' && classType === 'zoom' && (
            <Input
              label="Link Zoom"
              type="url"
              placeholder="https://zoom.us/j/..."
              {...register('zoom_link')}
            />
          )}

          {scheduleType === 'class' && classType === 'offline' && (
            <Input
              label="Lokasi"
              placeholder="Ruang 101, Gedung A"
              {...register('location')}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Program ID" type="number" {...register('program_id')} />
            <Input label="Teacher ID" type="number" {...register('teacher_id')} />
          </div>

          <Input
            label="Max Peserta"
            type="number"
            placeholder="Kosongkan untuk unlimited"
            {...register('max_participants')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              className="rounded border-gray-300"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Jadwal Aktif
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSchedule(null);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingSchedule ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}