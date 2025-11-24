import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar as CalIcon, Clock, User, MapPin, Link as LinkIcon, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(''); // State Search

  // --- FETCH DATA LISTS (Dropdown Resources) ---
  const { data: programsData } = useQuery({
    queryKey: ['admin-programs-list'],
    queryFn: async () => (await api.get('/admin/programs')).data,
  });
  const programsList = programsData?.data?.data || programsData?.data || [];
  
  const { data: allSubjectsData } = useQuery({
    queryKey: ['admin-subjects-all'],
    queryFn: async () => (await api.get('/admin/subjects')).data,
  });
  const allSubjects = allSubjectsData?.data?.data || allSubjectsData?.data || [];

  const { data: allTeachersData } = useQuery({
    queryKey: ['admin-teachers-all'],
    queryFn: async () => (await api.get('/admin/teachers')).data,
  });
  const allTeachersList = allTeachersData?.data?.data || allTeachersData?.data || [];
  
  // --- FETCH SCHEDULES (Paginated Table Data) ---
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['admin-schedules', currentPage, search],
    queryFn: async () => (await api.get(`/admin/schedules?page=${currentPage}&per_page=15&search=${search}`)).data,
  });

  const schedules = scheduleData?.data?.data || [];
  const pagination = scheduleData?.data;

  // --- FORM SETUP ---
  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm({
    defaultValues: { class_type_select: 'offline', type: 'class', is_active: true }
  });

  const classType = watch('class_type_select');
  const scheduleType = watch('type'); 
  const selectedProgramId = watch('program_id');

  // --- [OPTIMASI FILTER MAPEL] ---
  // Filter subject berdasarkan program yang dipilih
  const filteredSubjects = useMemo(() => {
    if (!selectedProgramId || !allSubjects.length) return [];
    return allSubjects.filter(s => s.program_id == selectedProgramId);
  }, [selectedProgramId, allSubjects]);

  // Reset subject jika program berubah (Hanya jika user sedang mengubah program secara manual)
  useEffect(() => {
     if (isModalOpen && !editingSchedule) {
         setValue('subject_id', '');
     }
  }, [selectedProgramId]);


  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/admin/schedules', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      handleCloseModal();
      toast.success('Jadwal berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat jadwal'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/admin/schedules/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      handleCloseModal();
      toast.success('Jadwal berhasil diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update jadwal'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      toast.success('Jadwal dihapus');
    },
  });

  // --- HANDLERS ---
  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      
      // Parse waktu dengan aman
      let startTimeVal = '';
      let endTimeVal = '';
      try {
          const startObj = new Date(schedule.start_time);
          const endObj = new Date(schedule.end_time);
          // Ambil HH:mm (5 karakter)
          startTimeVal = startObj.toTimeString().slice(0, 5); 
          endTimeVal = endObj.toTimeString().slice(0, 5);
      } catch (e) {
          console.error("Error parsing date", e);
      }

      // [PERBAIKAN] Gunakan reset() untuk mengisi semua data sekaligus
      // Ini mencegah 'race condition' antara program_id dan subject_id
      reset({
          title: schedule.title,
          type: schedule.type,
          program_id: schedule.program_id || '',
          subject_id: schedule.subject_id || '', // Reset subject dengan nilai yang benar
          teacher_id: schedule.teacher_id || '',
          date: new Date(schedule.start_time).toISOString().split('T')[0],
          start_clock: startTimeVal,
          end_clock: endTimeVal,
          class_type_select: schedule.class_type || 'offline',
          zoom_link: schedule.zoom_link || '',
          location: schedule.location || '',
          description: schedule.description || '',
          is_active: schedule.is_active,
          max_participants: schedule.max_participants
      });
    } else {
      setEditingSchedule(null);
      reset({ 
          class_type_select: 'offline', 
          type: 'class', 
          is_active: true,
          program_id: '',
          subject_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingSchedule(null);
      reset(); // Bersihkan form
  };

  const handleDelete = (schedule) => {
    showConfirm({
      title: 'Hapus Jadwal',
      message: 'Hapus jadwal ini?',
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(schedule.id),
    });
  };

  const onSubmit = (data) => {
    // Gabung Tanggal + Jam
    const startDateTime = `${data.date} ${data.start_clock}:00`;
    const endDateTime = `${data.date} ${data.end_clock}:00`;

    const payload = {
        title: data.title,
        type: data.type,
        class_type: data.class_type_select,
        program_id: data.program_id,
        // Null-kan jika tryout
        subject_id: data.type === 'tryout' ? null : data.subject_id,
        teacher_id: data.type === 'tryout' ? null : data.teacher_id,
        package_id: data.package_id,
        start_time: startDateTime,
        end_time: endDateTime,
        description: data.description,
        is_active: data.is_active,
        max_participants: data.max_participants,
    };

    if (data.class_type_select === 'zoom') {
        payload.zoom_link = data.zoom_link;
        payload.location = 'Online (Zoom)';
    } else {
        payload.location = data.location;
        payload.zoom_link = null;
    }

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { 
        header: 'Waktu', 
        render: (row) => (
            <div>
                <div className="text-sm font-bold text-gray-900">{new Date(row.start_time).toLocaleDateString('id-ID')}</div>
                <div className="text-xs text-gray-500">{new Date(row.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(row.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        )
    },
    { 
        header: 'Kegiatan', 
        render: (row) => (
            <div>
                <div className="text-sm font-bold text-blue-700">{row.title}</div>
                {row.type === 'class' && (
                    <div className="text-xs text-gray-600">{row.subject?.name} ({row.program?.name})</div>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.type === 'tryout' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {row.type === 'tryout' ? 'Tryout' : 'Kelas'}
                </span>
            </div>
        )
    },
    { 
        header: 'Pengajar', 
        render: (row) => (
            <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-sm">
                    {row.type === 'tryout' ? '-' : (row.teacher?.user?.name || '-')}
                </span>
            </div>
        )
    },
    { 
        header: 'Lokasi', 
        render: (row) => (
            <span className={`px-2 py-1 rounded text-xs font-medium border ${row.class_type === 'zoom' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                {row.class_type === 'zoom' ? 'Online' : row.location}
            </span>
        )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Jadwal Kelas & Tryout</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Jadwal</Button>
      </div>

      {/* [PERBAIKAN] SEARCH BAR */}
      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari jadwal, mapel, atau deskripsi..." 
            className="flex-1 border-none focus:ring-0 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={schedules} loading={isLoading} />
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
        title={editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <Input 
            label="Judul Kegiatan" 
            placeholder="Contoh: Pembahasan Soal" 
            {...register('title', { required: 'Judul wajib diisi' })} 
            error={errors.title?.message} 
          />

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kegiatan</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('type', { required: true })}>
                    <option value="class">Kelas Pembelajaran</option>
                    <option value="tryout">Tryout</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('program_id', { required: 'Program wajib diisi' })}>
                    <option value="">-- Pilih Program --</option>
                    {programsList?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.program_id && <p className="text-xs text-red-500 mt-1">{errors.program_id.message}</p>}
            </div>
          </div>

          {scheduleType === 'class' && (
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                    <select 
                        className="w-full border-gray-300 rounded-lg shadow-sm p-2 border disabled:bg-gray-100" 
                        {...register('subject_id', { required: 'Mapel wajib diisi' })}
                        disabled={!selectedProgramId || filteredSubjects.length === 0}
                    >
                        <option value="">
                            {!selectedProgramId ? '-- Pilih Program Dulu --' : 
                             filteredSubjects.length === 0 ? '-- Tidak ada Mapel --' : '-- Pilih Mapel --'}
                        </option>
                        {filteredSubjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    {errors.subject_id && <span className="text-xs text-red-500">{errors.subject_id.message}</span>}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pengajar</label>
                    <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('teacher_id', { required: 'Pengajar wajib diisi' })}>
                        <option value="">-- Pilih Pengajar --</option>
                        {allTeachersList?.map(t => <option key={t.id} value={t.id}>{t.user?.name || t.id}</option>)}
                    </select>
                    {errors.teacher_id && <span className="text-xs text-red-500">{errors.teacher_id.message}</span>}
                </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode Pelaksanaan</label>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50">
                    <input type="radio" value="offline" {...register('class_type_select')} className="text-blue-600" />
                    <div className="flex items-center gap-2 text-sm font-medium"><MapPin size={16}/> Offline</div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50">
                    <input type="radio" value="zoom" {...register('class_type_select')} className="text-blue-600" />
                    <div className="flex items-center gap-2 text-sm font-medium"><LinkIcon size={16}/> Online</div>
                </label>
            </div>
          </div>

          {classType === 'zoom' ? (
             <Input 
                label="Link Meeting" 
                placeholder="https://zoom.us/..." 
                {...register('zoom_link', { required: 'Link Zoom wajib diisi' })} 
                error={errors.zoom_link?.message} 
             />
          ) : (
             <Input 
                label="Lokasi Ruangan" 
                placeholder="Ruang 101" 
                {...register('location', { required: 'Lokasi wajib diisi' })} 
                error={errors.location?.message} 
             />
          )}

          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
             <div className="col-span-3 sm:col-span-1">
                <Input type="date" label="Tanggal" {...register('date', { required: true })} className="bg-white" error={errors.date?.message} />
             </div>
             <div className="col-span-3 sm:col-span-1">
                <Input type="time" label="Jam Mulai" {...register('start_clock', { required: true })} className="bg-white" error={errors.start_clock?.message} />
             </div>
             <div className="col-span-3 sm:col-span-1">
                <Input type="time" label="Jam Selesai" {...register('end_clock', { required: true })} className="bg-white" error={errors.end_clock?.message} />
             </div>
          </div>

          <Input label="Max Peserta" type="number" placeholder="Kosongkan untuk unlimited" {...register('max_participants')} />

          <div className="flex items-center">
            <input type="checkbox" id="is_active" {...register('is_active')} className="rounded text-blue-600" />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Jadwal Aktif</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingSchedule ? 'Simpan' : 'Buat Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}