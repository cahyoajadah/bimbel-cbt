// src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  BookOpen, 
  Video, 
  Award, 
  ArrowRight, 
  ChevronDown, 
  User as UserIcon, 
  ArrowLeft, 
  ArrowRight as ArrowRightIcon, 
  Zap 
} from 'lucide-react'; 
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react'; 
import api from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

import logo from "../assets/logo2.png"; 
import { useAuthStore } from '../store/authStore';

// --- Constants ---
const TESTIMONIALS_PER_PAGE = 3;

// Konfigurasi WhatsApp
const WA_CONFIG = {
  NUMBER: "6281338393846", 
  MESSAGE: "Halo Admin National Academy, saya tertarik dengan program bimbingan belajar. Boleh minta informasi lebih lanjut?"
};

const DUMMY_CONTENT = {
  HERO_DESCRIPTION: "Platform bimbingan belajar online terpercaya untuk persiapan UTBK, SKD, dan CPNS dengan metode pembelajaran modern dan interaktif. Raih skor terbaikmu bersama National Academy!",
  PROGRAMS: [
  {
    id: 1,
    title: 'Program UTBK Intensif',
    content: 'Program persiapan UTBK dengan sistem belajar terarah, soal HOTS terbaru, tryout berkala, dan pembahasan mendalam untuk memaksimalkan peluang lolos PTN impian.'
  },
  {
    id: 2,
    title: 'Pelatihan SKD CPNS',
    content: 'Pelatihan fokus SKD CPNS (TWK, TIU, TKP) dengan materi terupdate, latihan berbasis CAT, serta analisis nilai untuk meningkatkan skor secara signifikan.'
  },
  {
    id: 3,
    title: 'Bimbingan Sekolah Kedinasan',
    content: 'Bimbingan komprehensif masuk Sekolah Kedinasan mulai dari akademik, psikotes, hingga tes karakter dan wawancara, dibimbing oleh mentor berpengalaman.'
  },
],
  FEATURES: [
    { id: 1, title: 'Modul Belajar Digital', content: 'Tersedia ribuan modul dan materi belajar yang terstruktur, siap diakses kapan saja dan di mana saja.' },
    { id: 2, title: 'Tryout Berbasis CBT', content: 'Simulasi ujian Computer Based Test (CBT) yang akurat dan mirip dengan aslinya untuk mengukur kesiapanmu.' },
    { id: 3, title: 'Pembahasan Soal Interaktif', content: 'Video pembahasan dan penjelasan mendalam untuk setiap soal yang kamu kerjakan.' },
  ],
  TESTIMONIES: [
    { id: 1, title: 'Andi P. - Lulus UTBK 2024', content: '"Sistem belajarnya sangat terstruktur dan mentornya profesional. Saya berhasil masuk ke kampus impian saya. Terima kasih National Academy!"' },
    { id: 2, title: 'Budi S. - Lulus SKD CPNS', content: '"Latihan soalnya sangat relevan. Nilai SKD saya sangat memuaskan, bahkan melebihi target yang saya tetapkan. Rekomendasi banget!"' },
    { id: 3, title: 'Citra A. - Lulus Sekolah Kedinasan', content: '"Materi yang diberikan fokus dan padat. Saya sangat terbantu dengan jadwal bimbingan yang fleksibel. Tidak menyesal bergabung di sini."' },
  ],
  FAQ: [
    { id: 1, title: 'Apa saja program yang tersedia?', content: 'Program kami mencakup persiapan untuk UTBK, seleksi Kedinasan, dan SKD CPNS. Setiap program memiliki kurikulum dan paket tryout yang berbeda.' },
    { id: 2, title: 'Bagaimana cara mendaftar?', content: 'Anda dapat mendaftar melalui tombol "Daftar Sekarang" atau "Login" di bagian atas, lalu ikuti langkah-langkah pembuatan akun dan pemilihan program.' },
    { id: 3, title: 'Apakah ada sesi bimbingan tatap muka?', content: 'Saat ini, kami berfokus pada bimbingan belajar online interaktif melalui video, live class, dan modul digital.' },
  ],
};

// Komponen Tombol WhatsApp Floating
const WhatsAppButton = () => {
  const whatsappUrl = `https://wa.me/${WA_CONFIG.NUMBER}?text=${encodeURIComponent(WA_CONFIG.MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 flex items-center justify-center group"
      aria-label="Chat WhatsApp"
    >
        {/* SVG Logo WhatsApp Resmi */}
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        
        {/* Tooltip on Hover */}
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Hubungi Kami
        </span>
    </a>
  );
};

// Komponen Pembantu untuk FAQ (Accordion)
const FAQItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-b-0 py-4">
      <button
        className="flex justify-between items-center w-full text-left font-semibold text-lg text-gray-800 hover:text-blue-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div 
          className="mt-2 text-gray-600 pr-6 animate-fadeIn transition-opacity duration-300 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

// Komponen Utama
export default function Landing() {
  const { isAuthenticated, user } = useAuthStore();
  
  const profilePath = isAuthenticated 
    ? (user?.role === 'admin_manajemen' ? '/admin/dashboard' : (user?.role === 'pembuat_soal' ? '/question-maker/dashboard' : '/student/profile'))
    : '/login';

  // --- Data Fetching ---
  const { data: apiPrograms } = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PROGRAMS);
      return res.data.data;
    },
    staleTime: Infinity,
  });

  const { data: apiFeatures } = useQuery({
    queryKey: ['public-features'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.FEATURES);
      return res.data.data;
    },
    staleTime: Infinity,
  });

  const { data: apiTestimonies } = useQuery({
    queryKey: ['public-testimonies'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.TESTIMONIES);
      return res.data.data;
    },
    staleTime: Infinity,
  });

  const { data: apiFaq } = useQuery({
    queryKey: ['public-faq'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.FAQ); 
      return res.data.data;
    },
    staleTime: Infinity,
  });

  const programs = apiPrograms?.length > 0 ? apiPrograms : DUMMY_CONTENT.PROGRAMS;
  const features = apiFeatures?.length > 0 ? apiFeatures : DUMMY_CONTENT.FEATURES;
  const allTestimonies = apiTestimonies?.length > 0 ? apiTestimonies : DUMMY_CONTENT.TESTIMONIES;
  const faq = apiFaq?.length > 0 ? apiFaq : DUMMY_CONTENT.FAQ;
  
  // --- Pagination Testimoni ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(allTestimonies.length / TESTIMONIALS_PER_PAGE);

  const startIndex = (currentPage - 1) * TESTIMONIALS_PER_PAGE;
  const endIndex = startIndex + TESTIMONIALS_PER_PAGE;
  const currentTestimonies = allTestimonies.slice(startIndex, endIndex);

  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-blue-600">
              <Link to={isAuthenticated ? profilePath : "/"}>
                <img 
                  src={logo} 
                  alt="National Academy Logo"
                  style={{ height: "40px" }} 
                />
              </Link>
            </h1>
            <div className="flex items-center space-x-6">
              <Link to="/gallery" className="text-gray-600 font-medium hover:text-blue-600 transition-colors hidden sm:block">
                Galeri
              </Link>
              <Link to="/blog" className="text-gray-600 font-medium hover:text-blue-600 transition-colors hidden sm:block">
                Blog
              </Link>
              <Link
                to={profilePath}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center ${
                  isAuthenticated 
                    ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 shadow-md'
                    : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                }`}
              >
                <UserIcon className="w-5 h-5 mr-2" />
                {isAuthenticated ? (user?.role === 'admin_manajemen' ? 'Dashboard' : 'Profile') : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 opacity-20" style={{
          backgroundImage: `radial-gradient(at 0% 0%, #dbeafe 0, transparent 50%), radial-gradient(at 100% 100%, #e0f2f1 0, transparent 50%)`,
        }}></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="text-center lg:text-left lg:w-1/2">
            <p className="text-blue-600 font-semibold text-sm mb-2 uppercase tracking-widest">
                Percaya Diri Lulus Tes
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Raih Impianmu Bersama
              <img 
                  src={logo} 
                  alt="National Academy Logo"
                  style={{ height: "150px" }} 
              />
              {/* <span className="text-blue-600 block sm:inline-block"> National Academy</span> */}
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
              {DUMMY_CONTENT.HERO_DESCRIPTION}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/login"
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-lg shadow-blue-500/50 hover:bg-blue-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              >
                Mulai Belajar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              {/* <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-md">
                Lihat Program
              </button> */}
            </div>
          </div>

          <div className="lg:w-1/2 mt-12 lg:mt-0 p-4 rounded-3xl shadow-2xl shadow-blue-200/50 bg-white/90 backdrop-blur-sm">
            <img 
              src="https://picsum.photos/800/600?random=2" 
              alt="Ilustrasi Belajar Online" 
              className="rounded-2xl w-full h-auto object-cover shadow-inner"
              style={{ minHeight: '300px' }} 
            />
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Program Bimbingan Belajar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pilih program yang sesuai dengan kebutuhanmu.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-300 border border-white hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-md">
                  <BookOpen className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{program.title}</h3>
                <div 
                  className="text-gray-600 mb-6 leading-relaxed min-h-[72px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: program.content }}
                />
                {/* <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center transition-colors">
                  Pelajari Lebih Lanjut
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button> */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fitur-fitur unggulan yang akan membantu kesuksesanmu.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature) => (
              <div key={feature.id} className="flex flex-col p-6 rounded-xl bg-gray-50/70 shadow-lg shadow-gray-100/50 border border-gray-100 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 shadow-md">
                        <Zap className="w-6 h-6 text-blue-600" /> 
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">
                        {feature.title}
                    </h3>
                </div>
                <div 
                  className="text-gray-600 leading-relaxed pl-12 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: feature.content }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-indigo-50/50 px-4 sm:px-6 lg:px-8 border-y border-indigo-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Testimoni jujur dari siswa-siswa yang telah berhasil meraih impiannya.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {currentTestimonies.map((testimony) => (
              <div key={testimony.id} className="bg-white rounded-2xl p-8 shadow-xl shadow-indigo-100/50 border border-white hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <img
                      src={testimony.image ? `http://localhost:8000/storage/${testimony.image}` : `https://picsum.photos/50/50?random=${testimony.id}`}
                      alt={`Foto ${testimony.title}`}
                      className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-white shadow-md"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${testimony.title}&background=random`; }}
                  />
                  <div>
                    <div className="flex items-center text-yellow-500 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Award key={i} className="w-4 h-4 fill-yellow-500 mr-1" />
                      ))}
                    </div>
                    <p className="font-bold text-base text-gray-900">{testimony.title}</p>
                  </div>
                </div>

                <div 
                  className="text-gray-700 italic leading-relaxed min-h-[96px] border-t pt-6 mt-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: testimony.content }}
                />
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 space-x-4">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Sebelumnya
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center"
              >
                Selanjutnya <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Pertanyaan Umum (FAQ)
            </h2>
            <p className="text-xl text-gray-600">
              Temukan jawaban atas pertanyaan yang sering diajukan.
            </p>
          </div>
          
          <div className="space-y-2 bg-gray-50 p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
            {faq.map((item) => (
              <FAQItem key={item.id} title={item.title} content={item.content} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl shadow-blue-300/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan siswa yang telah meraih kesuksesan bersama kami
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-10 py-4 bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors duration-300 font-extrabold text-lg shadow-2xl shadow-blue-900/40"
          >
            Mulai Belajar
            <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 National Academy Taruna Bangsa. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Insert WhatsApp Button Here */}
      <WhatsAppButton />
    </div>
  );
}