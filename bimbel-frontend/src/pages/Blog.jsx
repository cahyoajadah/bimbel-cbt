// src/pages/Blog.jsx
import { Link } from 'react-router-dom';
import { User, Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import logo from "../assets/logo2.png"; 
import { useQuery } from '@tanstack/react-query'; // NEW
import api from '../api/axiosConfig'; // NEW
import { API_ENDPOINTS } from '../api/endpoints'; // NEW


// Mock Auth Store
const useAuthStore = () => ({
  isLoggedIn: true,
  user: { role: 'siswa', name: 'Siswa Demo' },
});

const BLOG_POSTS = [
  {
    id: 1,
    title: 'Strategi Jitu Menaklukkan Soal TPS UTBK 2025',
    category: 'Tips Belajar',
    date: '10 Des 2024',
    readTime: '5 menit',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    content: 'Tes Potensi Skolastik (TPS) seringkali menjadi momok bagi peserta UTBK. Namun, dengan pemahaman logika dasar dan latihan rutin, kamu bisa mendapatkan skor maksimal. Artikel ini membahas teknik scanning dan skimming dalam membaca soal...'
  },
  {
    id: 2,
    title: 'Perbedaan Materi SKD CPNS Tahun Ini dengan Tahun Lalu',
    category: 'Info CPNS',
    date: '08 Des 2024',
    readTime: '7 menit',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    content: 'Pemerintah kembali melakukan penyesuaian pada materi Seleksi Kompetensi Dasar (SKD). Perubahan terbesar ada pada bobot soal TKP (Tes Karakteristik Pribadi) yang kini lebih menekankan pada aspek pelayanan publik dan jejaring kerja...'
  },
  {
    id: 3,
    title: '5 Jurusan Kuliah Paling Dicari di Era Digital',
    category: 'Karir',
    date: '01 Des 2024',
    readTime: '4 menit',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800',
    content: 'Dunia kerja terus berubah. Jurusan seperti Data Science, Cyber Security, dan Digital Marketing kini menjadi primadona. Simak prospek karir dan universitas mana saja yang menyediakan jurusan-jurusan masa depan ini.'
  },
];

export default function Blog() {
  const { isLoggedIn, user } = useAuthStore();
  const profilePath = isLoggedIn 
    ? (user.role === 'admin' ? '/admin/dashboard' : '/student/profile')
    : '/login';

  // [NEW] Fetch Real Data
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['public-blogs'],
    queryFn: async () => {
      // Pastikan backend support filter ?section=blog
      const res = await api.get(`${API_ENDPOINTS.PUBLIC_BLOG}`); 
      return res.data.data; 
    }
  });

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* --- Navigation --- */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-blue-600">
              <Link to="/">
                <img 
                    src={logo} 
                    alt="National Academy Logo"
                    style={{ height: "40px" }} // bisa disesuaikan
                />
              </Link>
            </h1>
            <div className="flex items-center space-x-6">
              <Link to="/gallery" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">Galeri</Link>
              <Link to="/blog" className="text-blue-600 font-bold transition-colors">Blog</Link>
              <Link
                to={profilePath}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center ${
                  isLoggedIn 
                    ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 shadow-md'
                    : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                }`}
              >
                <User className="w-5 h-5 mr-2" />
                {isLoggedIn ? (user.role === 'admin' ? 'Dashboard' : 'Profile') : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Blog --- */}
      <section className="pt-32 pb-12 px-4 bg-blue-50 text-center">
        <div className="max-w-4xl mx-auto">
            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">Wawasan & Informasi</span>
            <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Blog Terbaru</h1>
            <p className="text-lg text-gray-600">
            Temukan artikel menarik seputar tips belajar, info pendaftaran, dan pengembangan diri.
            </p>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {isLoading ? <p className="text-center">Memuat artikel...</p> : (
             blogs?.length > 0 ? blogs.map((post) => (
                <div key={post.id} className="flex flex-col md:flex-row gap-8 items-start bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100">
                  <div className="w-full md:w-1/3 flex-shrink-0">
                    <img 
                        // Fallback image jika null
                        src={post.image ? `http://localhost:8000/storage/${post.image}` : 'https://via.placeholder.com/400x300'} 
                        alt={post.title} 
                        className="w-full h-56 object-cover rounded-xl shadow-md"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Artikel</span>
                        <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1"/> 
                            {new Date(post.created_at).toLocaleDateString('id-ID')}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer">
                        <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                        {post.content}
                    </p>
                    <Link to={`/blog/${post.id}`} className="text-blue-600 font-bold flex items-center hover:underline">
                        Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
             )) : <p className="text-center text-gray-500">Belum ada artikel blog.</p>
          )}
        </div>
      </section>

       {/* Footer Simple */}
       <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p className="text-gray-400">© 2025 National Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}