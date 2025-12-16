# Bimbel CBT - Sistem Computer-Based Test untuk Bimbingan Belajar

Repositori ini berisi aplikasi full-stack untuk sistem Computer-Based Test (CBT) yang digunakan dalam pengelolaan bimbingan belajar. Proyek ini terdiri dari dua bagian utama: frontend berbasis React dan backend berbasis Laravel.

## 📁 Struktur Repositori

```
bimbel-cbt/
├── bimbel-frontend/          # Aplikasi Frontend (React + Vite)
├── sistem-bimbel/            # Aplikasi Backend (Laravel)
└── package.json              # Root package configuration
```

---

## 🎨 Frontend (`bimbel-frontend/`)

Aplikasi frontend dibangun menggunakan **React** dengan **Vite** sebagai build tool.

### Struktur Direktori Frontend

```
bimbel-frontend/
├── public/                   # Asset statis publik
├── src/
│   ├── api/                 # Konfigurasi dan layanan API
│   │   ├── axiosConfig.js   # Setup Axios instance
│   │   ├── endpoints.js     # Definisi endpoint API
│   │   └── services/        # Service layer untuk API calls
│   │
│   ├── assets/              # Asset aplikasi (gambar, icon, dll)
│   │
│   ├── components/          # Komponen React reusable
│   │   ├── common/          # Komponen umum (Button, Input, Modal, dll)
│   │   └── layout/          # Komponen layout (Header, Footer, Sidebar)
│   │
│   ├── pages/               # Halaman/View aplikasi
│   │   ├── admin/           # Halaman untuk role Admin
│   │   ├── questionMaker/   # Halaman untuk role Question Maker
│   │   ├── student/         # Halaman untuk role Student
│   │   ├── Blog.jsx         # Halaman Blog
│   │   ├── BlogDetail.jsx   # Detail Blog
│   │   ├── Gallery.jsx      # Galeri
│   │   ├── Landing.jsx      # Landing page
│   │   ├── Login.jsx        # Halaman Login
│   │   └── NotFound.jsx     # 404 Page
│   │
│   ├── routes/              # Konfigurasi routing
│   │   ├── AppRoutes.jsx    # Definisi routes utama
│   │   ├── ProtectedRoute.jsx   # Route guard untuk autentikasi
│   │   └── RoleBasedRoute.jsx   # Route guard berdasarkan role
│   │
│   ├── store/               # State Management (Zustand)
│   │   ├── authStore.js     # Store untuk autentikasi
│   │   ├── cbtStore.js      # Store untuk data CBT
│   │   └── uiStore.js       # Store untuk UI state
│   │
│   ├── utils/               # Utility functions
│   │   ├── constants.js     # Konstanta aplikasi
│   │   └── helpers.js       # Helper functions
│   │
│   ├── App.jsx              # Root component
│   ├── App.css              # Global styles untuk App
│   ├── main.jsx             # Entry point aplikasi
│   └── index.css            # Global CSS
│
├── eslint.config.js         # Konfigurasi ESLint
├── index.html               # Template HTML
├── package.json             # Dependencies frontend
├── postcss.config.js        # Konfigurasi PostCSS
├── tailwind.config.js       # Konfigurasi Tailwind CSS
├── vite.config.js           # Konfigurasi Vite
└── README.md                # Dokumentasi frontend
```

### Teknologi Frontend
- **React** - Library UI
- **Vite** - Build tool dan dev server
- **Tailwind CSS** - Styling framework
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing

---

## 🚀 Backend (`sistem-bimbel/`)

Aplikasi backend dibangun menggunakan **Laravel** framework untuk menyediakan REST API.

### Struktur Direktori Backend

```
sistem-bimbel/
├── app/
│   ├── Exceptions/          # Custom exception handlers
│   │   └── Handler.php
│   │
│   ├── Http/
│   │   ├── Controllers/     # API Controllers
│   │   ├── Middleware/      # Custom middleware
│   │   └── Requests/        # Form request validation
│   │
│   ├── Mail/                # Email templates & classes
│   │   └── NewStudentAccount.php
│   │
│   ├── Models/              # Eloquent Models
│   │   ├── Announcement.php          # Model Pengumuman
│   │   ├── AnswerOption.php          # Opsi jawaban soal
│   │   ├── Attendance.php            # Presensi
│   │   ├── CbtSession.php            # Sesi ujian CBT
│   │   ├── Feedback.php              # Feedback/ulasan
│   │   ├── LandingContent.php        # Konten landing page
│   │   ├── Material.php              # Materi pembelajaran
│   │   ├── Package.php               # Paket bimbel
│   │   ├── Program.php               # Program bimbel
│   │   ├── Question.php              # Soal ujian
│   │   ├── QuestionCategory.php      # Kategori soal
│   │   ├── QuestionPackage.php       # Paket soal
│   │   └── ...                       # Model lainnya
│   │
│   ├── Policies/            # Authorization policies
│   ├── Providers/           # Service providers
│   └── Services/            # Business logic layer
│
├── bootstrap/               # Bootstrap Laravel
│   ├── app.php
│   ├── providers.php
│   └── cache/
│
├── config/                  # File konfigurasi
│   ├── app.php              # Konfigurasi aplikasi
│   ├── auth.php             # Konfigurasi autentikasi
│   ├── cache.php            # Konfigurasi cache
│   ├── cors.php             # CORS configuration
│   ├── database.php         # Konfigurasi database
│   ├── filesystems.php      # Storage configuration
│   ├── mail.php             # Email configuration
│   ├── queue.php            # Queue configuration
│   ├── sanctum.php          # API authentication (Sanctum)
│   └── ...
│
├── database/
│   ├── factories/           # Model factories untuk testing
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
│
├── public/                  # Web root directory
│   ├── index.php            # Entry point
│   ├── storage -> ../storage/app/public
│   └── robots.txt
│
├── resources/
│   ├── css/                 # CSS assets
│   ├── js/                  # JavaScript assets
│   └── views/               # Blade templates (jika digunakan)
│
├── routes/
│   ├── api.php              # API routes
│   ├── web.php              # Web routes
│   └── console.php          # Artisan console commands
│
├── storage/                 # Storage untuk file generated
│   ├── app/                 # Application files
│   ├── framework/           # Framework generated files
│   └── logs/                # Application logs
│
├── tests/                   # Unit & Feature tests
│   ├── Feature/
│   ├── Unit/
│   └── TestCase.php
│
├── vendor/                  # Composer dependencies
├── artisan                  # Laravel CLI tool
├── composer.json            # PHP dependencies
├── package.json             # Node dependencies (untuk assets)
├── phpunit.xml              # PHPUnit configuration
├── vite.config.js           # Vite config untuk Laravel Mix
└── README.md                # Dokumentasi backend
```

### Teknologi Backend
- **Laravel** - PHP Framework
- **MySQL/PostgreSQL** - Database
- **Sanctum** - API Authentication
- **Eloquent ORM** - Database ORM
- **PHPUnit** - Testing framework

---

## 🔑 Fitur Utama Sistem

### 1. **Multi-Role System**
Sistem mendukung tiga role utama:
- **Admin**: Manajemen sistem, user, dan paket
- **Question Maker**: Membuat dan mengelola soal ujian
- **Student**: Mengikuti ujian dan melihat hasil

### 2. **CBT (Computer-Based Test)**
- Sistem ujian berbasis komputer
- Timer untuk setiap sesi ujian
- Penilaian otomatis
- Hasil ujian real-time

### 3. **Manajemen Konten**
- Blog & artikel
- Galeri foto
- Landing page dinamis
- Pengumuman

### 4. **Manajemen Akademik**
- Program bimbingan belajar
- Paket pembelajaran
- Materi pembelajaran
- Presensi siswa
- Feedback & evaluasi

---

## 🛠️ Teknologi Stack

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | ^18.x | UI Library |
| Vite | ^5.x | Build Tool |
| Tailwind CSS | ^3.x | CSS Framework |
| Zustand | Latest | State Management |
| Axios | Latest | HTTP Client |
| React Router | v6 | Routing |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Laravel | ^11.x | PHP Framework |
| PHP | ^8.2 | Programming Language |
| MySQL | ^8.0 | Database |
| Sanctum | Latest | API Auth |
| Composer | Latest | Dependency Manager |

---

## 🚀 Cara Menjalankan Proyek

### Prerequisites
- Node.js (v18 atau lebih baru)
- PHP (v8.2 atau lebih baru)
- Composer
- MySQL/PostgreSQL
- Git

### Setup Backend (Laravel)

```bash
# Masuk ke direktori backend
cd sistem-bimbel

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Konfigurasi database di file .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=bimbel_cbt
# DB_USERNAME=root
# DB_PASSWORD=

# Jalankan migrasi database
php artisan migrate

# (Opsional) Seed database dengan data dummy
php artisan db:seed

# Jalankan server development
php artisan serve
```

Backend akan berjalan di `http://localhost:8000`

### Setup Frontend (React + Vite)

```bash
# Masuk ke direktori frontend
cd bimbel-frontend

# Install dependencies
npm install

# Copy environment file (jika ada)
cp .env.example .env

# Konfigurasi API endpoint di .env atau axiosConfig.js
# VITE_API_URL=http://localhost:8000/api

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

---

## 📝 API Endpoints

Backend menyediakan REST API yang dapat diakses melalui `/api/*`. Dokumentasi lengkap endpoint tersedia di:
- File routes: [sistem-bimbel/routes/api.php](sistem-bimbel/routes/api.php)
- API Controllers: [sistem-bimbel/app/Http/Controllers/](sistem-bimbel/app/Http/Controllers/)

Contoh endpoint utama:
```
POST   /api/auth/login          # Login
POST   /api/auth/register       # Registrasi
POST   /api/auth/logout         # Logout
GET    /api/user                # Get user profile

GET    /api/programs            # List program
GET    /api/packages            # List paket
GET    /api/questions           # List soal
GET    /api/cbt-sessions        # List sesi CBT
POST   /api/cbt-sessions        # Create sesi CBT
...
```

---

## 🔐 Autentikasi & Otorisasi

### Autentikasi
- Backend menggunakan **Laravel Sanctum** untuk API token authentication
- Frontend menyimpan token di localStorage/sessionStorage
- Token dikirim via `Authorization: Bearer {token}` header

### Otorisasi
- Role-based access control (RBAC)
- Protected routes di frontend ([routes/ProtectedRoute.jsx](bimbel-frontend/src/routes/ProtectedRoute.jsx))
- Role-based routes ([routes/RoleBasedRoute.jsx](bimbel-frontend/src/routes/RoleBasedRoute.jsx))
- Laravel Policies untuk backend authorization

---

## 📦 State Management

Frontend menggunakan **Zustand** untuk state management dengan tiga store utama:

1. **authStore.js** - Mengelola state autentikasi
   - User data
   - Login status
   - Token management

2. **cbtStore.js** - Mengelola state CBT
   - Current test session
   - Questions
   - Answers
   - Timer

3. **uiStore.js** - Mengelola UI state
   - Modal state
   - Loading state
   - Notifications

---

## 🎨 Styling & UI

- **Tailwind CSS** untuk utility-first styling
- Konfigurasi: [bimbel-frontend/tailwind.config.js](bimbel-frontend/tailwind.config.js)
- Component-based styling
- Responsive design
- Dark mode ready (jika dikonfigurasi)

---

## 🧪 Testing

### Backend Testing
```bash
cd sistem-bimbel
php artisan test
```

### Frontend Testing
```bash
cd bimbel-frontend
npm run test
```

---

## 📂 Database Schema

Database utama mencakup tabel-tabel:
- `users` - Data pengguna (admin, guru, siswa)
- `programs` - Program bimbingan belajar
- `packages` - Paket pembelajaran
- `questions` - Bank soal
- `question_categories` - Kategori soal
- `question_packages` - Paket soal
- `cbt_sessions` - Sesi ujian CBT
- `answer_options` - Opsi jawaban
- `attendances` - Presensi
- `materials` - Materi pembelajaran
- `announcements` - Pengumuman
- `feedback` - Feedback pengguna
- `landing_contents` - Konten landing page

Detail schema dapat dilihat di: [sistem-bimbel/database/migrations/](sistem-bimbel/database/migrations/)

---

## 🤝 Kontribusi

Proyek ini merupakan tugas kelompok untuk mata kuliah Rekayasa Perangkat Lunak (RPL).

### Tim Pengembang
- Frontend Developer
- Backend Developer
- Database Administrator
- UI/UX Designer
- Project Manager

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik STIS Semester 5.

---

## 📞 Kontak & Support

Untuk pertanyaan atau dukungan, silakan hubungi tim pengembang.

---

**Last Updated**: December 2025
