// // src/pages/Landing.jsx
// import { Link } from 'react-router-dom';
// import { CheckCircle, BookOpen, Video, Award, ArrowRight } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
// import api from '../api/axiosConfig';
// import { API_ENDPOINTS } from '../api/endpoints';

// export default function Landing() {
//   const { data: programs } = useQuery({
//     queryKey: ['public-programs'],
//     queryFn: async () => {
//       const res = await api.get(API_ENDPOINTS.PROGRAMS);
//       return res.data.data;
//     },
//   });

//   const { data: features } = useQuery({
//     queryKey: ['public-features'],
//     queryFn: async () => {
//       const res = await api.get(API_ENDPOINTS.FEATURES);
//       return res.data.data;
//     },
//   });

//   const { data: testimonies } = useQuery({
//     queryKey: ['public-testimonies'],
//     queryFn: async () => {
//       const res = await api.get(API_ENDPOINTS.TESTIMONIES);
//       return res.data.data;
//     },
//   });

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Navigation */}
//       <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <h1 className="text-2xl font-bold text-blue-600">National Academy</h1>
//             <Link
//               to="/login"
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Login
//             </Link>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center">
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
//               Raih Impianmu Bersama
//               <span className="text-blue-600"> National Academy</span>
//             </h1>
//             <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//               Platform bimbingan belajar online terpercaya untuk persiapan UTBK, SKD, dan CPNS
//               dengan metode pembelajaran modern dan interaktif.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Link
//                 to="/login"
//                 className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
//               >
//                 Mulai Belajar
//                 <ArrowRight className="ml-2 w-5 h-5" />
//               </Link>
//               <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
//                 Lihat Program
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Programs Section */}
//       <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
//               Program Bimbingan Belajar
//             </h2>
//             <p className="text-lg text-gray-600">
//               Pilih program yang sesuai dengan kebutuhanmu
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {programs?.map((program) => (
//               <div
//                 key={program.id}
//                 className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
//               >
//                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
//                   <BookOpen className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
//                 <p className="text-gray-600 mb-4">{program.content}</p>
//                 <button className="text-blue-600 font-medium hover:text-blue-700 flex items-center">
//                   Pelajari Lebih Lanjut
//                   <ArrowRight className="ml-2 w-4 h-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
//               Kenapa Memilih Kami?
//             </h2>
//             <p className="text-lg text-gray-600">
//               Fitur-fitur unggulan yang akan membantu kesuksesanmu
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features?.map((feature) => (
//               <div key={feature.id} className="flex items-start space-x-4">
//                 <div className="flex-shrink-0">
//                   <CheckCircle className="w-6 h-6 text-green-500" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     {feature.title}
//                   </h3>
//                   <p className="text-gray-600">{feature.content}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials */}
//       <section className="py-20 bg-blue-50 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
//               Apa Kata Mereka?
//             </h2>
//             <p className="text-lg text-gray-600">
//               Testimoni dari siswa yang telah merasakan manfaatnya
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {testimonies?.map((testimony) => (
//               <div key={testimony.id} className="bg-white rounded-xl p-6 shadow-lg">
//                 <div className="flex items-center mb-4">
//                   <Award className="w-5 h-5 text-yellow-500" />
//                   <Award className="w-5 h-5 text-yellow-500" />
//                   <Award className="w-5 h-5 text-yellow-500" />
//                   <Award className="w-5 h-5 text-yellow-500" />
//                   <Award className="w-5 h-5 text-yellow-500" />
//                 </div>
//                 <p className="text-gray-600 mb-4">{testimony.content}</p>
//                 <p className="font-semibold text-gray-900">{testimony.title}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
//         <div className="max-w-4xl mx-auto text-center">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
//             Siap Memulai Perjalanan Belajarmu?
//           </h2>
//           <p className="text-xl text-blue-100 mb-8">
//             Bergabunglah dengan ribuan siswa yang telah meraih kesuksesan bersama kami
//           </p>
//           <Link
//             to="/login"
//             className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
//           >
//             Daftar Sekarang
//             <ArrowRight className="ml-2 w-5 h-5" />
//           </Link>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto text-center">
//           <p className="text-gray-400">
//             © 2025 National Academy Taruna Bangsa. All rights reserved.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }


// src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  BookOpen, 
  Video, 
  Award, 
  ArrowRight, 
  ChevronDown, 
  User as UserIcon, // [FIX] Di-alias agar tidak bentrok
  ArrowLeft, 
  ArrowRight as ArrowRightIcon, 
  Zap 
} from 'lucide-react'; 
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react'; 
import api from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

// [FIX] Import store asli, hapus kode Mock lama
import { useAuthStore } from '../store/authStore';

// --- Constants ---
const TESTIMONIALS_PER_PAGE = 3;

const DUMMY_CONTENT = {
  HERO_DESCRIPTION: "Platform bimbingan belajar online terpercaya untuk persiapan UTBK, SKD, dan CPNS dengan metode pembelajaran modern dan interaktif. Raih skor terbaikmu bersama National Academy!",
  PROGRAMS: [
    { id: 1, title: 'Program UTBK Intensif', content: 'In vitae odio sit amet magna auctor congue. Nam nec mi non nulla dictum mollis ac sit amet quam. Donec nec leo eu dui placerat iaculis. (Kelola di Admin)' },
    { id: 2, title: 'Pelatihan SKD CPNS', content: 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis a tristique dolor. (Kelola di Admin)' },
    { id: 3, title: 'Bimbingan Sekolah Kedinasan', content: 'Nunc vel enim ac dui laoreet luctus. Sed sit amet justo eu nulla pulvinar dignissim non eget magna. (Kelola di Admin)' },
  ],
  FEATURES: [
    { id: 1, title: 'Modul Belajar Digital', content: 'Tersedia ribuan modul dan materi belajar yang terstruktur, siap diakses kapan saja dan di mana saja. Lorem ipsum dolor sit amet. (Kelola di Admin)' },
    { id: 2, title: 'Tryout Berbasis CBT', content: 'Simulasi ujian Computer Based Test (CBT) yang akurat dan mirip dengan aslinya untuk mengukur kesiapanmu. Quisque vel efficitur leo. (Kelola di Admin)' },
    { id: 3, title: 'Pembahasan Soal Interaktif', content: 'Video pembahasan dan penjelasan mendalam untuk setiap soal yang kamu kerjakan. Sed euismod urna eget lorem pulvinar. (Kelola di Admin)' },
  ],
  TESTIMONIES: [
    { id: 1, title: 'Andi P. - Lulus UTBK 2024', content: '"Sistem belajarnya sangat terstruktur dan mentornya profesional. Saya berhasil masuk ke kampus impian saya. Terima kasih National Academy!" (Kelola di Admin)' },
    { id: 2, title: 'Budi S. - Lulus SKD CPNS', content: '"Latihan soalnya sangat relevan. Nilai SKD saya sangat memuaskan, bahkan melebihi target yang saya tetapkan. Rekomendasi banget!" (Kelola di Admin)' },
    { id: 3, title: 'Citra A. - Lulus Sekolah Kedinasan', content: '"Materi yang diberikan fokus dan padat. Saya sangat terbantu dengan jadwal bimbingan yang fleksibel. Tidak menyesal bergabung di sini." (Kelola di Admin)' },
    { id: 4, title: 'Dina B. - Top Score Tryout', content: '"Fitur tryout-nya paling realistis. Sangat membantu mengelola waktu dan strategi ujian!" (Kelola di Admin)' },
    { id: 5, title: 'Eko C. - Peningkatan Nilai Drastis', content: '"Sebelumnya nilai saya stagnan, setelah bergabung, peningkatan nilai saya terasa sekali. Materinya mudah dipahami." (Kelola di Admin)' },
    { id: 6, title: 'Fira D. - Rekomendasi Terbaik', content: '"Pelayanannya ramah, platformnya mudah digunakan. Sangat direkomendasikan untuk pejuang tes!" (Kelola di Admin)' },
  ],
  FAQ: [
    { id: 1, title: 'Apa saja program yang tersedia?', content: 'Program kami mencakup persiapan untuk UTBK, seleksi Kedinasan, dan SKD CPNS. Setiap program memiliki kurikulum dan paket tryout yang berbeda. (Kelola di Admin)' },
    { id: 2, title: 'Bagaimana cara mendaftar?', content: 'Anda dapat mendaftar melalui tombol "Daftar Sekarang" atau "Login" di bagian atas, lalu ikuti langkah-langkah pembuatan akun dan pemilihan program. (Kelola di Admin)' },
    { id: 3, title: 'Apakah ada sesi bimbingan tatap muka?', content: 'Saat ini, kami berfokus pada bimbingan belajar online interaktif melalui video, live class, dan modul digital. (Kelola di Admin)' },
  ],
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
        <p className="mt-2 text-gray-600 pr-6 animate-fadeIn transition-opacity duration-300">
          {content}
        </p>
      )}
    </div>
  );
};

// Komponen Utama
export default function Landing() {
  // [FIX] Mengambil status login dari store asli
  const { isAuthenticated, user } = useAuthStore();
  
  // Tentukan path profil berdasarkan role
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

  // Gabungkan data API dan Dummy
  const programs = apiPrograms?.length > 0 ? apiPrograms : DUMMY_CONTENT.PROGRAMS;
  const features = apiFeatures?.length > 0 ? apiFeatures : DUMMY_CONTENT.FEATURES;
  const allTestimonies = apiTestimonies?.length > 0 ? apiTestimonies : DUMMY_CONTENT.TESTIMONIES;
  const faq = apiFaq?.length > 0 ? apiFaq : DUMMY_CONTENT.FAQ;
  
  // --- State untuk Pagination Testimoni ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(allTestimonies.length / TESTIMONIALS_PER_PAGE);

  const startIndex = (currentPage - 1) * TESTIMONIALS_PER_PAGE;
  const endIndex = startIndex + TESTIMONIALS_PER_PAGE;
  const currentTestimonies = allTestimonies.slice(startIndex, endIndex);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };


  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-blue-600">
              <Link to={isAuthenticated ? profilePath : "/"}>National Academy</Link>
            </h1>
            <div className="flex items-center space-x-6">
              <Link 
                to="/gallery"
                className="text-gray-600 font-medium hover:text-blue-600 transition-colors hidden sm:block"
              >
                Galeri
              </Link>
              <Link 
                to="/blog"
                className="text-gray-600 font-medium hover:text-blue-600 transition-colors hidden sm:block"
              >
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
                {/* [FIX] Gunakan Alias UserIcon */}
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
              <span className="text-blue-600 block sm:inline-block"> National Academy</span>
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
              <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-md">
                Lihat Program
              </button>
            </div>
          </div>

          {/* Dummy Image Placeholder */}
          <div className="lg:w-1/2 mt-12 lg:mt-0 p-4 rounded-3xl shadow-2xl shadow-blue-200/50 bg-white/90 backdrop-blur-sm">
            <img 
              src="https://picsum.photos/800/600?random=2" 
              alt="Ilustrasi Belajar Online" 
              className="rounded-2xl w-full h-auto object-cover shadow-inner"
              style={{ minHeight: '300px' }} 
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              *Gambar ini hanya placeholder dan dapat diganti melalui CMS/Admin.
            </p>
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
              Pilih program yang sesuai dengan kebutuhanmu untuk mencapai tujuan akademik dan karir.
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
                <p className="text-gray-600 mb-6 leading-relaxed min-h-[72px]">{program.content}</p>
                <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center transition-colors">
                  Pelajari Lebih Lanjut
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
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
              Fitur-fitur unggulan yang akan membantu kesuksesanmu, dirancang dengan metode pembelajaran modern.
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
                <p className="text-gray-600 leading-relaxed pl-12">{feature.content}</p>
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
              Testimoni jujur dari siswa-siswa yang telah berhasil meraih impiannya bersama National Academy. (Halaman {currentPage} dari {totalPages})
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {currentTestimonies.map((testimony) => (
              <div key={testimony.id} className="bg-white rounded-2xl p-8 shadow-xl shadow-indigo-100/50 border border-white hover:shadow-2xl transition-shadow duration-300">
                
                <div className="flex items-center mb-4">
                  <img
                      src={`https://picsum.photos/50/50?random=${testimony.id}`}
                      alt={`Foto ${testimony.title}`}
                      className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-white shadow-md"
                  />
                  <div>
                    <div className="flex items-center text-yellow-500 mb-1">
                      <Award className="w-4 h-4 fill-yellow-500 mr-1" />
                      <Award className="w-4 h-4 fill-yellow-500 mr-1" />
                      <Award className="w-4 h-4 fill-yellow-500 mr-1" />
                      <Award className="w-4 h-4 fill-yellow-500 mr-1" />
                      <Award className="w-4 h-4 fill-yellow-500" />
                    </div>
                    <p className="font-bold text-base text-gray-900">{testimony.title}</p>
                  </div>
                </div>

                <p className="text-gray-700 italic leading-relaxed min-h-[96px] border-t pt-6 mt-4">
                    {testimony.content}
                </p>
              </div>
            ))}
          </div>
          
          {/* NEW: Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 space-x-4">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Sebelumnya
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center"
              >
                Selanjutnya
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* FAQ Section - Manageable Content */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Pertanyaan Umum (FAQ)
            </h2>
            <p className="text-xl text-gray-600">
              Temukan jawaban atas pertanyaan yang sering diajukan oleh calon siswa kami.
            </p>
          </div>
          
          <div className="space-y-2 bg-gray-50 p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
            {faq.map((item) => (
              <FAQItem key={item.id} title={item.title} content={item.content} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Softened Gradient */}
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
            Daftar Sekarang
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
    </div>
  );
}