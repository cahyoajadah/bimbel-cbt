// src/pages/Blog.jsx
import { Link } from 'react-router-dom';
import { User, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import logo from "../assets/logo2.png"; 

// Konstanta batas item per halaman
const ITEMS_PER_PAGE = 9; 
// Tambahkan helper function di luar component atau di utils
const stripHtml = (html) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};



export default function Blog() {
  const { isAuthenticated, user } = useAuthStore();
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const profilePath = isAuthenticated 
    ? (user?.role === 'admin_manajemen' ? '/admin/dashboard' : (user?.role === 'pembuat_soal' ? '/question-maker/dashboard' : '/student/profile'))
    : '/login';

  // Fetch Data dari API
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['public-blogs'],
    queryFn: async () => {
      // Mengambil semua data blog dari backend
      const res = await api.get(`${API_ENDPOINTS.PUBLIC_BLOG}`); 
      return res.data.data; 
    }
  });

  // --- Logic Pagination (Client-Side) ---
  const totalItems = blogs?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Ambil data (slice) untuk halaman saat ini
  const currentData = blogs?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handler Ganti Halaman
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Navbar (Konsisten dengan Gallery & Landing) */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-blue-600 flex items-center">
              <Link to="/">
                <img 
                  src={logo} 
                  alt="National Academy Logo"
                  style={{ height: "40px" }}
                  className="hover:opacity-80 transition-opacity"
                />
              </Link>
            </h1>
            <div className="flex items-center space-x-6">
              <Link to="/gallery" className="text-gray-600 font-medium hover:text-blue-600 transition-colors hidden sm:block">Galeri</Link>
              <Link to="/blog" className="text-blue-600 font-bold transition-colors hidden sm:block">Blog</Link>
              
              <Link
                to={profilePath}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center ${
                  isAuthenticated 
                    ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 shadow-md'
                    : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                }`}
              >
                <User className="w-5 h-5 mr-2" />
                {isAuthenticated ? (user?.role === 'admin' ? 'Dashboard' : 'Profile') : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 bg-blue-50 text-center">
        <div className="max-w-4xl mx-auto">
            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">Wawasan & Informasi</span>
            <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Blog Terbaru</h1>
            <p className="text-lg text-gray-600">
            Temukan artikel menarik seputar tips belajar, info pendaftaran, dan pengembangan diri.
            </p>
        </div>
      </section>

      {/* Blog List Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {isLoading ? (
             <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
          ) : (
             currentData?.length > 0 ? (
                <>
                  <div className="space-y-12">
                    {currentData.map((post) => (
                        <div key={post.id} className="flex flex-col md:flex-row gap-8 items-start bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100">
                        <div className="w-full md:w-1/3 flex-shrink-0">
                            <img 
                                // URL Gambar dari Storage
                                src={post.image ? `http://localhost:8000/storage/${post.image}` : 'https://via.placeholder.com/400x300?text=No+Image'} 
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
                            {/* <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                                {post.content}
                            </p> */}

                            <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                                {/* [FIX] Bersihkan HTML tag untuk preview */}
                                {stripHtml(post.content)}
                            </p>


                            <Link to={`/blog/${post.id}`} className="text-blue-600 font-bold flex items-center hover:underline">
                                Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                        </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-12 pt-8 border-t border-gray-100">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Sebelumnya
                      </button>
                      
                      <span className="text-gray-600 font-medium">
                        Halaman {currentPage} dari {totalPages}
                      </span>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                      >
                        Selanjutnya
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </>
             ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">Belum ada artikel blog.</p>
                </div>
             )
          )}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p className="text-gray-400">© 2025 National Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}