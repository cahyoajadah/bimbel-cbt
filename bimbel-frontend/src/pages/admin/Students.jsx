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
  const programs = programsData?.data || [];

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
      toast.success('Siswa ditambahkan (Email belum dikirim)');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
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

  // [MUTATION BARU] Kirim Kredensial
  const sendEmailMutation = useMutation({
      mutationFn: async (id) => {
          const res = await api.post(API_ENDPOINTS.ADMIN_SEND_CREDENTIALS(id));
          return res.data;
      },
      onSuccess: () => toast.success('Password di-reset & Email terkirim!'),
      onError: () => toast.error('Gagal mengirim email')
  });

  // --- HANDLERS ---
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
      setValue('password', '');
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

    if (editingStudent && (!data.password || data.password.trim() === '')) {
        delete payload.password;
    }

    if (editingStudent) {
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

  // [HANDLER BARU] Kirim Email
  const handleSendEmail = (student) => {
      showConfirm({
          title: 'Kirim Akses Akun',
          message: `Sistem akan membuat password baru secara acak untuk ${student.user?.name} dan mengirimkannya ke email ${student.user?.email}. Lanjutkan?`,
          confirmText: 'Reset & Kirim',
          onConfirm: () => sendEmailMutation.mutate(student.id)
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
          {/* TOMBOL EMAIL */}
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

      {/* Modal Form Sama Seperti Sebelumnya */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Data Siswa' : 'Registrasi Siswa Baru'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Content (Sama persis seperti sebelumnya, tidak berubah) */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><User size={16}/> 1. Informasi Akun</h3>
            <Input label="Nama Lengkap" required {...register('name', { required: 'Wajib' })} />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Email" type="email" required {...register('email', { required: 'Wajib' })} />
                <Input label="No. HP" {...register('phone', { required: 'Wajib' })} />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
               <Input 
                label={editingStudent ? "Ganti Password (Opsional)" : "Password"} type="password" 
                placeholder={editingStudent ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
                {...register('password', { required: !editingStudent, minLength: { value: 8, message: 'Min 8 karakter' } })} 
               />
               {!editingStudent && <p className="text-xs text-blue-600 mt-1">Disarankan: <b>siswa123</b></p>}
            </div>
          </div>
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><GraduationCap size={16}/> 2. Data Sekolah</h3>
            <div className="grid grid-cols-2 gap-3">
                 <Input label="NIS" {...register('student_number', { required: 'Wajib' })} />
                 <Input label="Asal Sekolah" {...register('school', { required: 'Wajib' })} />
            </div>
            <div className="grid grid-cols-1 gap-3">
                 <Input label="Tanggal Lahir" type="date" {...register('birth_date', { required: 'Wajib' })} />
                 <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <Input label="Nama Orang Tua" {...register('parent_name', { required: 'Wajib' })} className="bg-white"/>
                    <Input label="No. HP Orang Tua" {...register('parent_phone', { required: 'Wajib' })} className="bg-white"/>
                 </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" {...register('address', { required: 'Wajib' })}></textarea>
            </div>
          </div>
          <div className="space-y-3">
             <label className="block text-sm font-bold text-gray-800 flex items-center gap-2"><BookOpen size={16} /> 3. Program Bimbel</label>
             <select className="block w-full rounded-lg border-gray-300 shadow-sm p-2 border" {...register('program_id', { required: 'Wajib' })}>
                <option value="">-- Pilih Program --</option>
                {programs.map((prog) => <option key={prog.id} value={prog.id}>{prog.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2 mt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingStudent ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}