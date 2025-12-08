// src/pages/Gallery.jsx
import { Link } from 'react-router-dom';
import { User, Menu, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { useState } from 'react';

// Mock Auth Store (Sesuaikan dengan store Anda)
const useAuthStore = () => ({
  isLoggedIn: true, 
  user: { role: 'siswa', name: 'Siswa Demo' },
});

const GALLERY_ITEMS = [
  { id: 1, title: 'Suasana Belajar Intensif UTBK', category: 'Kelas', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800' },
  { id: 2, title: 'Tryout Akbar Nasional 2024', category: 'Event', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800' },
  { id: 3, title: 'Workshop Tips & Trik Lolos CPNS', category: 'Seminar', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800' },
  { id: 4, title: 'Diskusi Kelompok Siswa', category: 'Diskusi', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800' },
  { id: 5, title: 'Wisuda Kelulusan Batch 1', category: 'Seremoni', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800' },
  { id: 6, title: 'Kunjungan ke Kampus UI', category: 'Field Trip', image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=800' },
];

export default function Gallery() {
  const { isLoggedIn, user } = useAuthStore();
  const profilePath = isLoggedIn 
    ? (user.role === 'admin' ? '/admin/dashboard' : '/student/profile')
    : '/login';

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* --- Navigation (Konsisten dengan Landing) --- */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-blue-600">
              <Link to="/">National Academy</Link>
            </h1>
            <div className="flex items-center space-x-6">
              <Link to="/gallery" className="text-blue-600 font-bold transition-colors">Galeri</Link>
              <Link to="/blog" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">Blog</Link>
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

      {/* --- Hero Gallery --- */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Galeri Kegiatan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Intip keseruan dan semangat belajar para siswa National Academy dalam meraih impian mereka.
        </p>
      </section>

      {/* --- Gallery Grid --- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full w-fit mb-2">
                  {item.category}
                </span>
                <h3 className="text-white text-lg font-bold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p className="text-gray-400">© 2025 National Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}