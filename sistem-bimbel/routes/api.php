<?php
// ============================================
// routes/api.php
// ============================================
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Api\Admin\PackageController;
use App\Http\Controllers\Api\Admin\MaterialController;
use App\Http\Controllers\Api\Admin\ScheduleController;
use App\Http\Controllers\Api\Admin\TeacherController;
use App\Http\Controllers\Api\Admin\StudentController;
use App\Http\Controllers\Api\Admin\FeedbackController;
use App\Http\Controllers\Api\QuestionMaker\QuestionPackageController;
use App\Http\Controllers\Api\QuestionMaker\QuestionController;
use App\Http\Controllers\Api\QuestionMaker\QuestionReportController;
use App\Http\Controllers\Api\Student\StudentDashboardController;
use App\Http\Controllers\Api\Student\SubjectController;
use App\Http\Controllers\Api\Student\ClassController;
use App\Http\Controllers\Api\Student\CBTController;
use App\Http\Controllers\Api\Public\LandingController;

// ============================================
// PUBLIC ROUTES (Landing Page)
// ============================================
Route::prefix('public')->group(function () {
    Route::get('programs', [LandingController::class, 'programs']);
    Route::get('testimonies', [LandingController::class, 'testimonies']);
    Route::get('features', [LandingController::class, 'features']);
    Route::get('faq', [LandingController::class, 'faq']);
});

// ============================================
// AUTH ROUTES
// ============================================
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('profile', [AuthController::class, 'profile']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
    });
});

// ============================================
// ADMIN MANAJEMEN ROUTES
// ============================================
Route::middleware(['auth:sanctum', 'role:admin_manajemen'])
    ->prefix('admin')
    ->group(function () {
        
        // Dashboard
        Route::get('dashboard', [AdminDashboard::class, 'index']);
        
        // Packages (Paket Tryout)
        Route::apiResource('packages', PackageController::class);
        Route::post('packages/{id}/assign-students', [PackageController::class, 'assignToStudents']);
        
        // Materials (Materi)
        Route::apiResource('materials', MaterialController::class);
        Route::post('materials/{id}/assign-students', [MaterialController::class, 'assignToStudents']);
        
        // Schedules (Jadwal Tryout & Kelas)
        Route::apiResource('schedules', ScheduleController::class);
        
        // Teachers (Pembimbing)
        Route::apiResource('teachers', TeacherController::class);
        
        // Students (Siswa)
        Route::apiResource('students', StudentController::class);
        Route::get('students/{id}/programs', [StudentController::class, 'getPrograms']);
        Route::post('students/{id}/programs', [StudentController::class, 'assignProgram']);
        Route::get('students/{id}/attendance', [StudentController::class, 'getAttendance']);
        Route::post('students/{id}/attendance', [StudentController::class, 'recordAttendance']);
        
        // Feedback
        Route::get('feedbacks', [FeedbackController::class, 'index']);
        Route::post('feedbacks', [FeedbackController::class, 'store']);
        Route::get('feedbacks/{id}', [FeedbackController::class, 'show']);
        Route::put('feedbacks/{id}', [FeedbackController::class, 'update']);
        Route::delete('feedbacks/{id}', [FeedbackController::class, 'destroy']);
    });

// ============================================
// ADMIN PEMBUAT SOAL ROUTES
// ============================================
Route::middleware(['auth:sanctum', 'role:pembuat_soal'])
    ->prefix('question-maker')
    ->group(function () {
        
        // Question Packages
        Route::apiResource('packages', QuestionPackageController::class);
        
        // Questions
        Route::get('packages/{packageId}/questions', [QuestionController::class, 'index']);
        Route::post('packages/{packageId}/questions', [QuestionController::class, 'store']);
        Route::get('packages/{packageId}/questions/{id}', [QuestionController::class, 'show']);
        Route::put('packages/{packageId}/questions/{id}', [QuestionController::class, 'update']);
        Route::delete('packages/{packageId}/questions/{id}', [QuestionController::class, 'destroy']);
        
        // Question Reports (Pengaduan Soal)
        Route::get('reports', [QuestionReportController::class, 'index']);
        Route::post('reports/{id}/respond', [QuestionReportController::class, 'respond']);
    });

// ============================================
// STUDENT ROUTES
// ============================================
Route::middleware(['auth:sanctum', 'role:siswa'])
    ->prefix('student')
    ->group(function () {
        
        // Dashboard
        Route::get('dashboard', [StudentDashboardController::class, 'index']);
        
        // Subjects & Materials (Mata Pelajaran)
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::get('subjects/{id}', [SubjectController::class, 'show']);
        Route::get('subjects/{id}/materials', [SubjectController::class, 'getMaterials']);
        Route::post('materials/{id}/complete', [SubjectController::class, 'completeMaterial']);
        
        // Classes (Kelas Live)
        Route::get('classes', [ClassController::class, 'index']);
        Route::get('classes/upcoming', [ClassController::class, 'upcoming']);
        Route::post('classes/{id}/join', [ClassController::class, 'join']);
        
        // Schedules (Jadwal Bimbel)
        Route::get('schedules', [ClassController::class, 'schedules']);
        
        // Progress & Feedback
        Route::get('progress', [StudentDashboardController::class, 'progress']);
        Route::get('feedbacks', [StudentDashboardController::class, 'feedbacks']);
        
        // CBT / Tryout
        Route::get('tryouts', [CBTController::class, 'availableTryouts']);
        Route::post('tryouts/{packageId}/start', [CBTController::class, 'startSession']);
        Route::get('tryout-results/{resultId}/review', [CBTController::class, 'reviewResult']);
        Route::post('questions/report', [CBTController::class, 'reportQuestion']);
    });

// ============================================
// CBT SESSION ROUTES (Requires CBT Session Token)
// ============================================
Route::middleware(['auth:sanctum', 'role:siswa', 'cbt.session'])
    ->prefix('cbt')
    ->group(function () {
        Route::get('questions', [CBTController::class, 'getQuestions']);
        Route::post('answer', [CBTController::class, 'saveAnswer']);
        Route::post('submit', [CBTController::class, 'submitTryout']);
        Route::post('fullscreen-warning', [CBTController::class, 'fullscreenWarning']);
    });

// ============================================
// COMMON ROUTES (All authenticated users)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('programs', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Program::where('is_active', true)->get()
        ]);
    });
    
    Route::get('subjects', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Subject::with('program')->get()
        ]);
    });
});