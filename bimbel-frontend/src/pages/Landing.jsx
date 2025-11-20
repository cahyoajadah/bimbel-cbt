// src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { CheckCircle, BookOpen, Video, Award, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

export default function Landing() {
  const { data: programs } = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PROGRAMS);
      return res.data.data;
    },
  });

  const { data: features } = useQuery({
    queryKey: ['public-features'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.FEATURES);
      return res.data.data;
    },
  });

  const { data: testimonies } = useQuery({
    queryKey: ['public-testimonies'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.TESTIMONIES);
      return res.data.data;
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Bimbel Online</h1>
            <Link
              to="/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Raih Impianmu Bersama
              <span className="text-blue-600"> Bimbel Online</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Platform bimbingan belajar online terpercaya untuk persiapan UTBK, SKD, dan CPNS
              dengan metode pembelajaran modern dan interaktif.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Mulai Belajar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Lihat Program
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Program Bimbingan Belajar
            </h2>
            <p className="text-lg text-gray-600">
              Pilih program yang sesuai dengan kebutuhanmu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {programs?.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
                <p className="text-gray-600 mb-4">{program.content}</p>
                <button className="text-blue-600 font-medium hover:text-blue-700 flex items-center">
                  Pelajari Lebih Lanjut
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-lg text-gray-600">
              Fitur-fitur unggulan yang akan membantu kesuksesanmu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features?.map((feature) => (
              <div key={feature.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-lg text-gray-600">
              Testimoni dari siswa yang telah merasakan manfaatnya
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonies?.map((testimony) => (
              <div key={testimony.id} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <Award className="w-5 h-5 text-yellow-500" />
                  <Award className="w-5 h-5 text-yellow-500" />
                  <Award className="w-5 h-5 text-yellow-500" />
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-gray-600 mb-4">{testimony.content}</p>
                <p className="font-semibold text-gray-900">{testimony.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabunglah dengan ribuan siswa yang telah meraih kesuksesan bersama kami
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Daftar Sekarang
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 Bimbel Online. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
