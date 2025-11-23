// src/pages/admin/Schedules.jsx - KODE FINAL DAN TEROPTIMASI (Loop Fixed)
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar as CalIcon, Clock, User, MapPin, Link as LinkIcon } from 'lucide-react';
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
  const [filteredSubjects, setFilteredSubjects] = useState([]);

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
    queryKey: ['admin-schedules', currentPage],
    queryFn: async () => (await api.get(`/admin/schedules?page=${currentPage}&per_page=15`)).data,
  });

  const schedules = scheduleData?.data?.data || [];
  const pagination = scheduleData?.data;

  // --- FORM SETUP ---
  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm({
    defaultValues: { class_type_select: 'offline', type: 'class', is_active: true }
  });

  const classType = watch('class_type_select');
  const selectedProgramId = watch('program_id');

  // --- LOGIKA FILTER MAPEL (FIXED INFINITE LOOP) ---
  useEffect(() => {
    // 1. Dapatkan nilai form saat ini
    const currentProgramId = getValues('program_id');
    const currentSubjectId = getValues('subject_id'); 
    
    // 2. Filter subjects
    const filtered = currentProgramId && allSubjects 
        ? allSubjects.filter(s => s.program_id == currentProgramId)
        : [];
    
    // A. Update state dropdown subjects
    setFilteredSubjects(filtered); 

    // B. RESET LOGIC (Kunci pemutus loop)
    if (currentSubjectId) {
        const isSubjectStillValid = filtered.some(s => s.id == currentSubjectId);

        // Reset hanya jika subject ID saat ini tidak valid DAN nilainya BUKAN string kosong.
        if (!isSubjectStillValid) { 
            // Cek apakah nilai saat ini bukan string kosong
            if (currentSubjectId !== '') { 
               setValue('subject_id', '', { shouldValidate: true }); 
            }
        }
    }
    // Dependency Array: Hanya bergantung pada Program ID dan data Mapel global
  }, [selectedProgramId, allSubjects, getValues, setValue]); 


  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/admin/schedules', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-schedules']);
      setIsModalOpen(false);
      reset();
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
      setIsModalOpen(false);
      setEditingSchedule(null);
      reset();
      toast.success('Jadwal berhasil diperbarui');
    },
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
      
      const startDateObj = new Date(schedule.start_time);
      const endDateObj = new Date(schedule.end_time);
      
      setValue('title', schedule.title);
      setValue('type', schedule.type);
      setValue('program_id', schedule.program_id || '');
      
      // Memberi jeda (timeout) saat set program/subject agar filter berjalan lancar saat edit
      setTimeout(() => {
          setValue('subject_id', schedule.subject_id || '');
          setValue('teacher_id', schedule.teacher_id || '');
      }, 100);

      setValue('date', startDateObj.toISOString().split('T')[0]);
      setValue('start_clock', startDateObj.toTimeString().slice(0, 5));
      setValue('end_clock', endDateObj.toTimeString().slice(0, 5));
      setValue('class_type_select', schedule.class_type || 'offline');
      
      if (schedule.class_type === 'zoom') setValue('zoom_link', schedule.zoom_link);
      else setValue('location', schedule.location);
      
      setValue('description', schedule.description);
      setValue('is_active', schedule.is_active);
      setValue('max_participants', schedule.max_participants);
    } else {
      setEditingSchedule(null);
      reset({ class_type_select: 'offline', type: 'class', is_active: true });
      setFilteredSubjects([]);
    }
    setIsModalOpen(true);
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
    const startDateTime = `${data.date} ${data.start_clock}:00`;
    const endDateTime = `${data.date} ${data.end_clock}:00`;

    const payload = {
        title: data.title,
        type: data.type,
        class_type: data.class_type_select,
        program_id: data.program_id,
        subject_id: data.subject_id,
        teacher_id: data.teacher_id,
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

  // --- COLUMNS (Sama seperti sebelumnya) ---
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
        header: 'Kelas', 
        render: (row) => (
            <div>
                <div className="text-sm font-bold text-blue-700">{row.title}</div>
                <div className="text-xs text-gray-600">{row.subject?.name} ({row.program?.name})</div>
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
                <span className="text-sm">{row.teacher?.user?.name || '-'}</span>
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
          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Jadwal Kelas</h1>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Buat Jadwal</Button>
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
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <Input label="Judul Kegiatan" placeholder="Contoh: Pembahasan Soal" {...register('title', { required: 'Judul wajib diisi' })} error={errors.title} />

          <div className="grid grid-cols-2 gap-4">
            {/* Tipe Jadwal */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('type', { required: true })}>
                    <option value="class">Kelas Biasa</option>
                    <option value="tryout">Tryout</option>
                </select>
            </div>

            {/* Dropdown Program */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('program_id', { required: 'Program wajib diisi' })}>
                    <option value="">-- Pilih Program --</option>
                    {programsList?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DROPDOWN MAPEL (FILTERED) */}
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
            </div>
            
            {/* DROPDOWN PENGAJAR */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pengajar</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" {...register('teacher_id', { required: 'Pengajar wajib diisi' })}>
                    <option value="">-- Pilih Pengajar --</option>
                    {allTeachersList?.map(t => <option key={t.id} value={t.id}>{t.user?.name || t.id}</option>)}
                </select>
            </div>
          </div>

          {/* RADIO MODE KELAS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode Kelas</label>
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
             <Input label="Link Meeting" placeholder="https://zoom.us/..." {...register('zoom_link', { required: true })} error={errors.zoom_link} />
          ) : (
             <Input label="Lokasi Ruangan" placeholder="Ruang 101" {...register('location', { required: true })} error={errors.location} />
          )}

          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
             <div className="col-span-3 sm:col-span-1">
                <Input type="date" label="Tanggal" {...register('date', { required: true })} className="bg-white" />
             </div>
             <div className="col-span-3 sm:col-span-1">
                <Input type="time" label="Jam Mulai" {...register('start_clock', { required: true })} className="bg-white" />
             </div>
             <div className="col-span-3 sm:col-span-1">
                <Input type="time" label="Jam Selesai" {...register('end_clock', { required: true })} className="bg-white" />
             </div>
          </div>

          <Input label="Max Peserta" type="number" placeholder="Kosongkan untuk unlimited" {...register('max_participants')} />

          <div className="flex items-center">
            <input type="checkbox" id="is_active" {...register('is_active')} className="rounded text-blue-600" />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Jadwal Aktif</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingSchedule ? 'Simpan' : 'Buat Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}