import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Search, Shield, PenTool } from 'lucide-react';
import api from '../../api/axiosConfig';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function InternalUsers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pembuat_soal' 
  });

  // Fetch Users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['internal-users', search],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/users-manage', {
            params: { 
                search, 
                roles: ['admin_manajemen', 'pembuat_soal'] 
            }
        });
        console.log("API Response:", res.data); // Debugging
        return res.data.data;
      } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
      }
    },
  });

  // Mutations (Add & Delete)
  const addUserMutation = useMutation({
    mutationFn: async (newUser) => await api.post('/admin/users-manage', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries(['internal-users']);
      toast.success('Staf berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'pembuat_soal' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambah user')
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/users-manage/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['internal-users']);
      toast.success('User berhasil dihapus');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus user')
  });

  // Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password.length < 8) return toast.error('Password minimal 8 karakter');
    addUserMutation.mutate(formData);
  };

  // Helper Badge Aman
  const getRoleBadge = (role) => {
    if (!role) return <span className="text-gray-400">-</span>;
    
    // Support jika role berupa string atau object
    const roleName = (typeof role === 'object' ? role.name : role) || '';

    if (roleName === 'admin_manajemen') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Shield size={12} className="mr-1"/> Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><PenTool size={12} className="mr-1"/> Pembuat Soal</span>;
  };

  const columns = [
    { 
      header: 'Nama Staf', 
      accessor: 'name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-200">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
              <div className="font-semibold text-gray-900">{user.name || 'Tanpa Nama'}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
          </div>
      </div>
    )
  },
  { 
    header: 'Jabatan / Role', 
    accessor: 'role', // Dummy accessor
    render: (user) => getRoleBadge(user.role) 
  },
  { 
    header: 'Tanggal Gabung', 
    accessor: 'created_at', // Dummy accessor
    render: (user) => user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-' 
  },
  { 
    header: 'Aksi', 
    accessor: 'id', // Dummy accessor
    render: (user) => (
      <button 
          onClick={() => {
              if(window.confirm('Hapus akun staf ini?')) deleteUserMutation.mutate(user.id);
          }}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
      >
          <Trash2 size={18} />
      </button>
    )
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Staf</h1>
            <p className="text-gray-500">Kelola akun Admin dan Pembuat Soal.</p>
        </div>
        <Button icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Tambah Staf Baru
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Cari nama atau email..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {/* Perhatikan usersData?.data || [] */}
      <Table 
        columns={columns} 
        data={usersData?.data || []} 
        isLoading={isLoading}
        emptyMessage="Belum ada data staf."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Akun Staf">
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
                label="Nama Lengkap" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
            />
            <Input 
                label="Email Login" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
            />
            <Input 
                label="Password" 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
                placeholder="Minimal 8 karakter"
            />
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jabatan</label>
                <div className="grid grid-cols-2 gap-3">
                    <div 
                        onClick={() => setFormData({...formData, role: 'pembuat_soal'})}
                        className={clsx(
                            "cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all",
                            formData.role === 'pembuat_soal' 
                                ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500" 
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                    >
                        <PenTool size={20} />
                        <span className="text-sm font-bold">Pembuat Soal</span>
                    </div>
                    
                    <div 
                        onClick={() => setFormData({...formData, role: 'admin_manajemen'})}
                        className={clsx(
                            "cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all",
                            formData.role === 'admin_manajemen' 
                                ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500" 
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                    >
                        <Shield size={20} />
                        <span className="text-sm font-bold">Admin Manajemen</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" loading={addUserMutation.isPending}>
                    Simpan Akun
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}