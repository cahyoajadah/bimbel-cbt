import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, User, Mail, Phone, GraduationCap, MapPin, BookOpen, Send } from 'lucide-react';
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

export default function Students() {
  const queryClient = useQueryClient();
  const { showConfirm } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // --- FETCH DATA ---
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['admin-students', currentPage, search],
    queryFn: async () => {
      const res = await api.get(`/admin/students?page=${currentPage}&per_page=15&search=${search}`);
      return res.data.data;
    },
  });

  const students = studentsData?.data || [];
  const pagination = studentsData;

  // Fetch Programs
  const { data: programsData } = useQuery({
    queryKey: ['admin-programs-list'],
    queryFn: async () => (await api.get('/admin/programs?all=true')).data,
  });
  const programs = Array.isArray(programsData) ? programsData : (programsData?.data || []);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/admin/students', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      handleCloseModal();
      toast.success('Siswa berhasil ditambahkan (Email terkirim)');
    },
    onError: (err) => {
        const msg = err.response?.data?.errors 
            ? Object.values(err.response.data.errors)[0][0] 
            : err.response?.data?.message || 'Gagal menyimpan';
        toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/admin/students/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      handleCloseModal();
      toast.success('Data siswa diperbarui');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Siswa dihapus');
    },
  });

  const sendEmailMutation = useMutation({
      mutationFn: async (id) => {
          const res = await api.post(API_ENDPOINTS.ADMIN_SEND_CREDENTIALS(id));
          return res.data;
      },
      onSuccess: () => toast.success('Password di-reset & Email terkirim!'),
      onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim email')
  });

  // --- HANDLERS ---
  const handleSendEmail = (student) => {
      showConfirm({
          title: 'Reset & Kirim Akun',
          message: (
            <div className="text-left text-sm text-gray-600 space-y-3">
                <p>Anda akan mengatur ulang password untuk siswa ini:</p>
                <ul className="list-disc pl-5 font-medium text-gray-800">
                    <li>Nama: {student.user?.name}</li>
                    <li>Email: {student.user?.email}</li>
                </ul>
                <div className="text-red-600 font-bold bg-red-50 p-3 rounded border border-red-100 mt-2">
                    ⚠️ Password lama tidak akan berlaku lagi. Password baru akan digenerate acak dan dikirim otomatis ke email tersebut.
                </div>
            </div>
          ),
          confirmText: 'Kirim Password Baru',
          type: 'warning',
          onConfirm: () => sendEmailMutation.mutate(student.id)
      });
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setValue('name', student.user?.name);
      setValue('email', student.user?.email);
      setValue('phone', student.user?.phone);
      setValue('student_number', student.student_number);
      setValue('school', student.school);
      setValue('address', student.address);
      
      const birthDate = student.birth_date ? student.birth_date.split('T')[0] : '';
      setValue('birth_date', birthDate);
      
      setValue('parent_name', student.parent_name);
      setValue('parent_phone', student.parent_phone);

      const firstProgramId = student.programs?.[0]?.id || '';
      setValue('program_id', firstProgramId);
      
      // Password tidak perlu diset karena field-nya disembunyikan saat edit
    } else {
      setEditingStudent(null);
      reset({ 
          program_id: '', name: '', email: '', password: '', phone: '',
          student_number: '', school: '', address: '', birth_date: '', parent_name: '', parent_phone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    reset();
  };

  const onSubmit = (data) => {
    const payload = {
        ...data,
        program_ids: data.program_id ? [parseInt(data.program_id)] : []
    };
    delete payload.program_id;

    // [PERBAIKAN] Hapus password dari payload jika sedang EDIT
    if (editingStudent) {
        delete payload.password;
        updateMutation.mutate({ id: editingStudent.id, data: payload });
    } else {
        createMutation.mutate(payload);
    }
  };

  const handleDelete = (student) => {
    showConfirm({
      title: 'Hapus Siswa',
      message: `Yakin hapus data siswa ${student.user?.name}?`,
      type: 'danger',
      confirmText: 'Hapus',
      onConfirm: () => deleteMutation.mutate(student.id),
    });
  };

  // --- TABEL ---
  const columns = [
    { 
      header: 'Nama Siswa', 
      render: (row) => (
        <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {row.user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
                <div className="font-medium text-gray-900">{row.user?.name}</div>
                <div className="text-xs text-gray-500 font-mono">{row.student_number}</div>
            </div>
        </div>
      )
    },
    { header: 'Asal Sekolah', accessor: 'school', render: (row) => <span className="text-sm">{row.school || '-'}</span> },
    {
      header: 'Orang Tua',
      render: (row) => (
        <div className="text-xs text-gray-600">
            <div className="font-medium">{row.parent_name || '-'}</div>
            <div className="text-gray-400">{row.parent_phone}</div>
        </div>
      )
    },
    { 
        header: 'Program', 
        render: (row) => {
            const programName = row.programs?.[0]?.name;
            return programName ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {programName}
                </span>
            ) : <span className="text-gray-400 text-xs italic">-</span>;
        }
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            icon={Send} 
            onClick={() => handleSendEmail(row)}
            title="Reset Password & Kirim Email"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
             Kirim Akun
          </Button>

          <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenModal(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row)} className="text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
          <p className="text-sm text-gray-600">Kelola akun, data orang tua, dan program siswa</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Tambah Siswa</Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Cari nama, NIS, atau sekolah..." 
            className="flex-1 border-none focus:ring-0 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={students} loading={isLoading} />
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
        title={editingStudent ? 'Edit Data Siswa' : 'Registrasi Siswa Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <User size={16}/> 1. Informasi Akun
            </h3>
            
            <Input label="Nama Lengkap" placeholder="Nama Siswa" {...register('name', { required: 'Nama wajib diisi' })} error={errors.name?.message} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Email (Username)" type="email" placeholder="email@contoh.com" {...register('email', { required: 'Email wajib diisi' })} error={errors.email?.message} />
                <Input label="Nomor HP Siswa" type="tel" placeholder="08..." {...register('phone', { required: 'HP Siswa wajib diisi' })} error={errors.phone?.message} />
            </div>
            
            {/* [PERBAIKAN] Hanya muncul jika BUKAN EDITING */}
            {!editingStudent && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <Input 
                    label="Password Awal" 
                    type="password" 
                    placeholder="Min. 8 karakter"
                    {...register('password', { required: true, minLength: { value: 8, message: 'Min 8 karakter' } })} 
                    error={errors.password?.message} 
                   />
                   <p className="text-xs text-blue-600 mt-1">Password ini akan dikirim otomatis ke email siswa setelah disimpan.</p>
                </div>
            )}
          </div>

          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap size={16}/> 2. Data Sekolah & Pribadi
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
                 <Input label="Nomor Induk (NIS)" placeholder="Nomor Induk" {...register('student_number', { required: 'NIS wajib diisi' })} error={errors.student_number?.message} />
                 <Input label="Asal Sekolah" placeholder="Nama Sekolah" {...register('school', { required: 'Asal Sekolah wajib diisi' })} error={errors.school?.message} />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                 <Input label="Tanggal Lahir" type="date" {...register('birth_date', { required: 'Tanggal Lahir wajib diisi' })} error={errors.birth_date?.message} />
                 <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <Input label="Nama Orang Tua" {...register('parent_name', { required: 'Nama Ortu wajib diisi' })} error={errors.parent_name?.message} className="bg-white"/>
                    <Input label="No. HP Orang Tua" {...register('parent_phone', { required: 'HP Ortu wajib diisi' })} error={errors.parent_phone?.message} className="bg-white"/>
                 </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Domisili</label>
                <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                    rows="2"
                    placeholder="Alamat lengkap siswa..."
                    {...register('address', { required: 'Alamat wajib diisi' })}
                ></textarea>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>

          <div className="space-y-3">
             <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookOpen size={16} /> 3. Program Bimbel
             </label>
             <select
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                {...register('program_id', { required: 'Program wajib dipilih' })}
            >
                <option value="">-- Pilih Program --</option>
                {programs.length > 0 ? programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>{prog.name}</option>
                )) : <option disabled>Tidak ada program tersedia</option>}
            </select>
            {errors.program_id && <p className="text-red-500 text-xs mt-1">{errors.program_id.message}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2 mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingStudent ? 'Perbarui Data' : 'Simpan & Kirim Akun'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}