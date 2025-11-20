// ============================================
// src/pages/NotFound.jsx
// ============================================
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-blue-100 mb-8 max-w-md">
          Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>
        <Link to="/">
          <Button icon={Home} className="bg-white text-blue-600 hover:bg-gray-100">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}