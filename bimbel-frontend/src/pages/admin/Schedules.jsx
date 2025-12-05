import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar as CalIcon, Clock, User, MapPin, Link as LinkIcon, Search, BookOpen, Info } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Table, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // --- FETCH DATA LISTS (Dropdown Resources) ---
  const { data: programsData } = useQuery({
    queryKey: ['admin-programs-list'],
    queryFn: async () => (await api.get('/admin/programs')).data,
  });
  // Gunakan useMemo agar referensi array stabil
  const programsList = useMemo(() => programsData?.data?.data || programsData?.data || [], [programsData]);
  
  const { data: allSubjectsData } = useQuery({
    queryKey: ['admin-subjects-all'],
    queryFn: async () => (await api.get('/admin/subjects')).data,
  });
  // Gunakan useMemo agar referensi array stabil (Mencegah Infinite Loop)
  const allSubjects = useMemo(() => allSubjectsData?.data?.data || allSubjectsData?.data || [], [allSubjectsData]);

  const { data: allTeachersData } = useQuery({
    queryKey: ['admin-teachers-all'],
    queryFn: async () => (await api.get('/admin/teachers')).data,
  });
  const allTeachersList = useMemo(() => allTeachersData?.data?.data || allTeachersData?.data || [], [allTeachersData]);
  
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

  // --- [OPTIMASI] FILTER MAPEL DENGAN USEMEMO ---
  // Hitung filtered subjects secara otomatis saat program berubah (Tanpa State tambahan)
  const filteredSubjects = useMemo(() => {
      if (!selectedProgramId || !allSubjects.length) return [];
      return allSubjects.filter(s => s.program_id == selectedProgramId);
  }, [selectedProgramId, allSubjects]);

  // --- LOGIKA RESET VALUE ---
  // Hanya jalankan effect jika kita perlu MERESET subject_id yang tidak valid
  useEffect(() => {
      const currentSubjectId = getValues('subject_id');
      
      // Jika ada subject terpilih, tapi tidak ada di daftar filter (tidak valid untuk program ini)
      if (currentSubjectId && filteredSubjects.length > 0) {
          const isValid = filteredSubjects.some(s => s.id == currentSubjectId);
          if (!isValid) {
              setValue('subject_id', ''); // Reset nilai
          }
      } 
      // Jika program diganti jadi kosong/tidak ada, reset subject
      else if (!selectedProgramId && currentSubjectId) {
          setValue('subject_id', '');
      }
  }, [selectedProgramId, filteredSubjects, getValues, setValue]);


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
      
      let startDateVal = '';
      let startTimeVal = '';
      let endTimeVal = '';

      if (schedule.start_time) {
         const startObj = new Date(schedule.start_time);
         startDateVal = startObj.toISOString().split('T')[0];
         startTimeVal = startObj.toTimeString().slice(0, 5);
      }
      if (schedule.end_time) {
         const endObj = new Date(schedule.end_time);
         endTimeVal = endObj.toTimeString().slice(0, 5);
      }
      
      // Reset form dengan data edit
      // Timeout kecil untuk memastikan UI siap
      setTimeout(() => {
          setValue('title', schedule.title);
          setValue('type', schedule.type);
          setValue('program_id', schedule.program_id || '');
          
          // Subject & Teacher set belakangan agar list filter ready (jika diperlukan)
          setValue('subject_id', schedule.subject_id || '');
          setValue('teacher_id', schedule.teacher_id || '');

          setValue('date', startDateVal);
          setValue('start_clock', startTimeVal);
          setValue('end_clock', endTimeVal);
          
          setValue('class_type_select', schedule.class_type || 'offline');
          if (schedule.class_type === 'zoom') setValue('zoom_link', schedule.zoom_link);
          else setValue('location', schedule.location);
          
          setValue('description', schedule.description);
          setValue('is_active', schedule.is_active);
          setValue('max_participants', schedule.max_participants);
      }, 50);

    } else {
      setEditingSchedule(null);
      reset({ class_type_select: 'offline', type: 'class', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    reset({ class_type_select: 'offline', type: 'class', is_active: true });
  };

  const handleDelete = (schedule) => {
    showConfirm({
      title: 'Hapus Jadwal',
      message: 'Hapus jadwal ini?',
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(schedule.id),
    });
  };

  const onSubmit = (data) => {
    const startDateTime = `${data.date} ${data.start_clock}:00`;
    const endDateTime = `${data.date} ${data.end_clock}:00`;

    const payload = {
        title: data.title,
        type: data.type,
        class_type: data.class_type_select,
        program_id: data.program_id,
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

  // --- COLUMNS ---
  const columns = [
    { 
        header: 'Kegiatan', 
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    row.type === 'tryout' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                )}>
                    {row.type === 'tryout' ? 'T' : 'K'}
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">{row.title}</div>
                    <div className="text-xs text-gray-500">
                        {row.type === 'class' ? `${row.subject?.name || '-'} (${row.program?.name || '-'})` : 'Tryout Akbar'}
                    </div>
                </div>
            </div>
        )
    },
    { 
        header: 'Waktu', 
        render: (row) => (
            <div>
                <div className="text-sm font-medium text-gray-900">{new Date(row.start_time).toLocaleDateString('id-ID')}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12}/>
                    {new Date(row.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(row.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
            </div>
        )
    },
    { 
        header: 'Pengajar', 
        render: (row) => (
            <div className="text-sm text-gray-700">
                {row.teacher?.name || '-'}
            </div>
        )
    },
    { 
        header: 'Lokasi', 
        render: (row) => (
            <span className={clsx(
                "px-2 py-1 rounded text-xs font-medium border",
                row.class_type === 'zoom' ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-orange-50 border-orange-200 text-orange-700"
            )}>
                {row.class_type === 'zoom' ? 'Online' : 'Offline'}
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
        <h1 className="text-2xl font-bold text-gray-800">Jadwal & Kegiatan</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Jadwal</Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari jadwal..." 
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
        title={editingSchedule ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={16}/> 1. Informasi Kegiatan
            </h3>
            
            <Input 
                label="Judul Kegiatan" 
                placeholder="Contoh: Pembahasan Soal Matematika" 
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
                        disabled={!filteredSubjects.length}
                    >
                        <option value="">
                            {!filteredSubjects.length ? '-- Tidak ada Mapel --' : '-- Pilih Mapel --'}
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
                        {allTeachersList?.map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                    </select>
                    {errors.teacher_id && <span className="text-xs text-red-500">{errors.teacher_id.message}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock size={16}/> 2. Waktu & Pelaksanaan
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-1">
                    <Input type="date" label="Tanggal" {...register('date', { required: true })} className="bg-white" error={errors.date?.message} />
                 </div>
                 <div className="col-span-1">
                    <Input type="time" label="Mulai" {...register('start_clock', { required: true })} className="bg-white" error={errors.start_clock?.message} />
                 </div>
                 <div className="col-span-1">
                    <Input type="time" label="Selesai" {...register('end_clock', { required: true })} className="bg-white" error={errors.end_clock?.message} />
                 </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode Pelaksanaan</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition-all">
                        <input type="radio" value="offline" {...register('class_type_select')} className="text-blue-600 focus:ring-blue-500" />
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin size={16}/> Offline</div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50 has-[:checked]:bg-purple-50 has-[:checked]:border-purple-500 transition-all">
                        <input type="radio" value="zoom" {...register('class_type_select')} className="text-purple-600 focus:ring-purple-500" />
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><LinkIcon size={16}/> Online (Zoom)</div>
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
                    placeholder="Contoh: Ruang 101, Lantai 2" 
                    {...register('location', { required: 'Lokasi wajib diisi' })} 
                    error={errors.location?.message} 
                />
            )}
            
            <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_active" {...register('is_active')} className="rounded text-blue-600 w-4 h-4" />
                <label htmlFor="is_active" className="text-sm text-gray-700 select-none">Jadwal Aktif</label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingSchedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}