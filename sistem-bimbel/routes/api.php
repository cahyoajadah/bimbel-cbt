<?php
// ============================================
// routes/api.php
// ============================================
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Api\Admin\PackageController;
use App\Http\Controllers\Api\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\Api\Admin\MaterialController;
use App\Http\Controllers\Api\Admin\ProgramController;
use App\Http\Controllers\Api\Admin\ScheduleController;
use App\Http\Controllers\Api\Admin\TeacherController;
use App\Http\Controllers\Api\Admin\StudentController;
use App\Http\Controllers\Api\Admin\FeedbackController;
use App\Http\Controllers\Api\Admin\AnnouncementController as AdminAnnouncement;
use App\Http\Controllers\Api\QuestionMaker\QuestionPackageController;
use App\Http\Controllers\Api\QuestionMaker\QuestionController;
use App\Http\Controllers\Api\QuestionMaker\QuestionReportController;
use App\Http\Controllers\Api\Student\StudentDashboardController;
use App\Http\Controllers\Api\Student\SubjectController as StudentSubjectController;
use App\Http\Controllers\Api\Student\ClassController;
use App\Http\Controllers\Api\Student\CBTController;
use App\Http\Controllers\Api\Student\AnnouncementController as StudentAnnouncement;
use App\Http\Controllers\Api\Public\LandingController;

// PUBLIC ROUTES
Route::prefix('public')->group(function () {
    Route::get('programs', [LandingController::class, 'programs']);
    Route::get('testimonies', [LandingController::class, 'testimonies']);
    Route::get('features', [LandingController::class, 'features']);
    Route::get('faq', [LandingController::class, 'faq']);

    // [BARU] Route untuk Galeri dan Blog Publik
    Route::get('gallery', [LandingController::class, 'gallery']);
    Route::get('blog', [LandingController::class, 'blog']);
    Route::get('blog/{id}', [LandingController::class, 'showBlog']); // Detail blog
});

// AUTH ROUTES
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

// ADMIN MANAJEMEN ROUTES
Route::middleware(['auth:sanctum', 'role:admin_manajemen'])
    ->prefix('admin')
    ->group(function () {
        Route::get('dashboard', [AdminDashboard::class, 'index']);
        
        // Packages (Hapus resource Packages jika tidak dipakai di API lagi, tapi biarkan jika QuestionMaker pakai model yang sama,
        // tapi instruksinya hapus dari admin management. Kita hapus routenya dari sini.)
        // Route::apiResource('packages', PackageController::class); 
        
        Route::apiResource('materials', MaterialController::class);
        Route::apiResource('schedules', ScheduleController::class);
        Route::apiResource('subjects', AdminSubjectController::class);
        Route::apiResource('programs', ProgramController::class);
        Route::apiResource('teachers', TeacherController::class);
        Route::apiResource('announcements', AdminAnnouncement::class);
        Route::apiResource('landing-contents', \App\Http\Controllers\Api\Admin\LandingContentController::class);
        // Students
        Route::apiResource('students', StudentController::class);
        Route::get('students/{id}/programs', [StudentController::class, 'getPrograms']);
        Route::post('students/{id}/programs', [StudentController::class, 'assignProgram']);
        Route::get('students/{id}/attendance', [StudentController::class, 'getAttendance']);
        Route::post('students/{id}/attendance', [StudentController::class, 'recordAttendance']);
        Route::post('students/{id}/send-credentials', [StudentController::class, 'sendAccountInfo']);
        
        // [BARU] Route Detail Progress untuk Monitoring
        Route::get('students/{id}/progress-detail', [StudentController::class, 'progressDetail']);
        
        // Feedback (Endpoint untuk kirim feedback)
        Route::get('feedbacks', [FeedbackController::class, 'index']);
        Route::post('feedbacks', [FeedbackController::class, 'store']);
        Route::get('feedbacks/{id}', [FeedbackController::class, 'show']);
        Route::put('feedbacks/{id}', [FeedbackController::class, 'update']);
        Route::delete('feedbacks/{id}', [FeedbackController::class, 'destroy']);
    });

// ADMIN PEMBUAT SOAL ROUTES
Route::middleware(['auth:sanctum', 'role:pembuat_soal'])
    ->prefix('question-maker')
    ->group(function () {
        Route::apiResource('packages', QuestionPackageController::class);
        Route::get('packages/{packageId}/questions', [QuestionController::class, 'index']);
        Route::post('packages/{packageId}/questions', [QuestionController::class, 'store']);
        Route::get('packages/{packageId}/questions/{id}', [QuestionController::class, 'show']);
        Route::put('packages/{packageId}/questions/{id}', [QuestionController::class, 'update']);
        Route::delete('packages/{packageId}/questions/{id}', [QuestionController::class, 'destroy']);
        Route::get('reports', [QuestionReportController::class, 'index']);
        Route::post('reports/{id}/respond', [QuestionReportController::class, 'respond']);
    });

// STUDENT ROUTES
Route::middleware(['auth:sanctum', 'role:siswa'])
    ->prefix('student')
    ->group(function () {
        Route::get('dashboard', [StudentDashboardController::class, 'index']);
        Route::get('subjects', [StudentSubjectController::class, 'index']);
        Route::get('subjects/{id}', [StudentSubjectController::class, 'show']);
        Route::get('subjects/{id}/materials', [StudentSubjectController::class, 'getMaterials']);
        Route::post('materials/{id}/complete', [StudentSubjectController::class, 'completeMaterial']);
        Route::get('classes', [ClassController::class, 'index']);
        Route::get('classes/upcoming', [ClassController::class, 'upcoming']);
        Route::post('classes/{id}/join', [ClassController::class, 'join']);
        Route::get('schedules', [ClassController::class, 'schedules']);
        Route::get('progress', [StudentDashboardController::class, 'progress']);
        Route::get('announcements', [StudentAnnouncement::class, 'index']);
        Route::get('announcements/recent', [StudentAnnouncement::class, 'recent']);
        Route::post('announcements/{id}/read', [StudentAnnouncement::class, 'markAsRead']);
        
        // [BARU] Feedback untuk Siswa
        Route::get('feedbacks', [StudentDashboardController::class, 'feedbacks']);
        
        Route::get('tryouts', [CBTController::class, 'availableTryouts']);
        Route::post('tryouts/{packageId}/start', [CBTController::class, 'startSession']);
        Route::get('tryout-results/{resultId}', [CBTController::class, 'reviewResult']);
        Route::post('questions/report', [CBTController::class, 'reportQuestion']);
    });

// CBT SESSION ROUTES
Route::middleware(['auth:sanctum', 'role:siswa', 'cbt.session'])
    ->prefix('cbt')
    ->group(function () {
        Route::get('questions', [CBTController::class, 'getQuestions']);
        Route::post('answer', [CBTController::class, 'saveAnswer']);
        Route::post('submit', [CBTController::class, 'submitTryout']);
        Route::post('fullscreen-warning', [CBTController::class, 'fullscreenWarning']);
    });

// COMMON ROUTES
Route::middleware('auth:sanctum')->group(function () {
    Route::get('programs', function () {
        return response()->json(['success' => true, 'data' => \App\Models\Program::where('is_active', true)->get()]);
    });
    Route::get('subjects', function () {
        return response()->json(['success' => true, 'data' => \App\Models\Subject::with('program')->get()]);
    });
    Route::post('/upload-image', [UploadController::class, 'uploadImage']);
});