// // ============================================
// // src/pages/Login.jsx
// // ============================================
// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
// import { useMutation } from '@tanstack/react-query';
// import { authService } from '../api/services/authService';
// import { useAuthStore } from '../store/authStore';
// import toast from 'react-hot-toast';
// import { Input } from '../components/common/Input';
// import { Button } from '../components/common/Button';

// const loginSchema = z.object({
//   email: z.string().email('Email tidak valid'),
//   password: z.string().min(6, 'Password minimal 6 karakter'),
// });

// export default function Login() {
//   const navigate = useNavigate();
//   const { setAuth } = useAuthStore();
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       email: '',
//       password: '',
//     },
//   });

//   const loginMutation = useMutation({
//     mutationFn: authService.login,
//     onSuccess: (data) => {
//       const { user, token } = data.data;
//       setAuth(user, token);
      
//       toast.success('Login berhasil!');

//       // Redirect based on role
//       const roleRedirects = {
//         'admin_manajemen': '/admin/dashboard',
//         'pembuat_soal': '/question-maker/dashboard',
//         'siswa': '/student/dashboard',
//       };

//       navigate(roleRedirects[user.role] || '/');
//     },
//     onError: (error) => {
//       toast.error(error.response?.data?.message || 'Login gagal');
//     },
//   });

//   const onSubmit = (data) => {
//     loginMutation.mutate(data);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-white mb-2">National Academy</h1>
//           <p className="text-blue-100">Masuk ke akun Anda</p>
//         </div>

//         {/* Login Form */}
//         <div className="bg-white rounded-2xl shadow-xl p-8">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             <Input
//               label="Email"
//               type="email"
//               icon={Mail}
//               error={errors.email?.message}
//               {...register('email')}
//               placeholder="nama@email.com"
//             />

//             <div className="relative">
//               <Input
//                 label="Password"
//                 type={showPassword ? 'text' : 'password'}
//                 icon={Lock}
//                 error={errors.password?.message}
//                 {...register('password')}
//                 placeholder="••••••••"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//               </button>
//             </div>

//             <Button
//               type="submit"
//               className="w-full"
//               loading={loginMutation.isPending}
//             >
//               {loginMutation.isPending ? 'Memproses...' : 'Login'}
//             </Button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600">
//               Belum punya akun?{' '}
//               <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
//                 Kembali ke Beranda
//               </Link>
//             </p>
//           </div>

//           {/* Demo Accounts */}
//           <div className="mt-6 p-4 bg-blue-50 rounded-lg">
//             <p className="text-xs text-gray-600 mb-2 font-medium">Demo Accounts:</p>
//             <div className="space-y-1 text-xs text-gray-600">
//               <p>Admin: admin@bimbel.com / password123</p>
//               <p>Pembuat Soal: pembuat.soal@bimbel.com / password123</p>
//               <p>Siswa: siswautbk@bimbel.com / password123</p>
//               <p>Siswa: siswaskd@bimbel.com / password123</p>
//               <p>Siswa: siswacpns@bimbel.com / password123</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// ============================================
// src/pages/Login.jsx
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import logo from "../assets/logo2.png";   // path relatif dari file login.jsx

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const { user, token } = data.data;
      setAuth(user, token);
      
      toast.success('Login berhasil!');

      // Redirect based on role
      const roleRedirects = {
        'admin_manajemen': '/admin/dashboard',
        'pembuat_soal': '/question-maker/dashboard',
        'siswa': '/student/dashboard',
      };

      navigate(roleRedirects[user.role] || '/');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login gagal');
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      
      {/* Container utama dengan efek animasi transisi masuk yang lembut */}
      <div 
        className="max-w-md w-full transform opacity-100 transition-all duration-700 ease-out" 
      >
        
        {/* Logo/Header - Warna teks disesuaikan untuk latar belakang terang */}
        {/* Logo/Header - Mengganti H1 dengan tag IMG */}
        <div className="text-center mb-8">
          <img 
            src={logo} // Menggunakan gambar yang diimport
            alt="National Academy Logo" 
            className="mx-auto h-16 w-auto mb-4" // Menentukan ukuran dan membuatnya responsif serta di tengah
          />
          {/* <h1 className="text-4xl font-bold text-blue-900 mb-2">National Academy</h1> <-- Dihapus/diganti */}
          <p className="text-gray-600">Masuk ke akun Anda</p>
        </div>

        {/* Login Form - Kartu yang ambient, semi-transparan, dengan shadow abu-abu bersih */}
        <div className="
          bg-white/90 rounded-3xl p-10 
          shadow-lg shadow-gray-200 backdrop-blur-sm 
          transition-all duration-300 ease-in-out
          hover:shadow-xl hover:shadow-gray-300 hover:scale-[1.01] 
          transform motion-safe:hover:scale-[1.01]
        ">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
              placeholder="nama@email.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                error={errors.password?.message}
                {...register('password')}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">
              Belum punya akun?{' '}
              <Link to="/" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                Kembali ke Beranda
              </Link>
            </p>
          </div>

          {/* Demo Accounts - Latar belakang ambient grey */}
          <div className="mt-6 p-4 bg-gray-100/70 rounded-lg">
            <p className="text-xs text-gray-700 mb-2 font-medium">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-700">
              <p>Admin: admin@bimbel.com / password123</p>
              <p>Pembuat Soal: pembuat.soal@bimbel.com / password123</p>
              <p>Siswa: siswautbk@bimbel.com / password123</p>
              <p>Siswa: siswaskd@bimbel.com / password123</p>
              <p>Siswa: siswacpns@bimbel.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}