// src/pages/BlogDetail.jsx
import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import api from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

// Helper function untuk format tanggal
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Fetch Detail Blog
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-detail', id],
    queryFn: async () => {
      // Pastikan backend memiliki route: Route::get('public/blog/{id}', ...)
      const res = await api.get(API_ENDPOINTS.PUBLIC_CONTENT_DETAIL(id));
      return res.data.data;
    },
  });

  // Tentukan link kembali (dashboard jika login, home jika guest)
  const backLink = isAuthenticated 
    ? (user?.role === 'siswa' ? '/student/dashboard' : '/') 
    : '/blog';

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  if (isError || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Blog tidak ditemukan</h2>
        <button onClick={() => navigate('/blog')} className="text-blue-600 hover:underline">Kembali ke List Blog</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar Simple */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to={backLink} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali
            </Link>
            <h1 className="font-bold text-blue-600 text-lg">National Academy Blog</h1>
        </div>
      </nav>

      {/* Content */}
      <article className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                    {post.category || 'Artikel'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                    {post.title}
                </h1>
                <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {formatDate(post.created_at)}</span>
                    <span className="flex items-center"><User className="w-4 h-4 mr-1"/> Admin</span>
                </div>
            </div>

            {/* Featured Image */}
            {post.image && (
                <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                        src={`http://localhost:8000/storage/${post.image}`} // Sesuaikan base URL API
                        alt={post.title} 
                        className="w-full h-auto object-cover"
                    />
                </div>
            )}

            {/* Body */}
            <div className="prose prose-lg prose-blue mx-auto text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
            </div>
        </div>
      </article>
    </div>
  );
}