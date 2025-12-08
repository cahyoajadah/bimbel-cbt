// src/pages/Gallery.jsx
import { Link } from 'react-router-dom';
import { User, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/axiosConfig';
import { useAuthStore } from '../store/authStore';
import logo from "../assets/logo2.png"; 

export default function Gallery() {
  const { isAuthenticated, user } = useAuthStore();
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // [REQ] Maksimal 9 konten

  const profilePath = isAuthenticated 
    ? (user?.role === 'admin_manajemen' ? '/admin/dashboard' : (user?.role === 'pembuat_soal' ? '/question-maker/dashboard' : '/student/profile'))
    : '/login';

  // [FIX] Mengambil data Real dari API
  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: async () => {
      // Pastikan route ini mengambil data dengan section='gallery'
      const res = await api.get('/public/gallery'); 
      return res.data.data;
    },
  });

  // Logic Pagination
  const totalItems = galleryItems?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Ambil data untuk halaman saat ini
  const currentItems = galleryItems 
    ? galleryItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  // Handler Ganti Halaman
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* --- Navigation --- */}
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
              <Link to="/gallery" className="text-blue-600 font-bold transition-colors">Galeri</Link>
              <Link to="/blog" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">Blog</Link>
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

      {/* --- Hero Gallery --- */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Galeri Kegiatan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Intip keseruan dan semangat belajar para siswa National Academy.
        </p>
      </section>

      {/* --- Gallery Grid --- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : currentItems?.length > 0 ? (
            <>
              {/* Grid Item */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {currentItems.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer h-64 border border-gray-100">
                    <img 
                      // [FIX] Menggunakan URL Storage Laravel yang benar
                      src={item.image ? `http://localhost:8000/storage/${item.image}` : 'https://via.placeholder.com/600x400?text=No+Image'} 
                      alt={item.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <h3 className="text-white text-lg font-bold">{item.title}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* [NEW] Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4">
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
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Belum ada foto kegiatan.</p>
            </div>
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