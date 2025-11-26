<?php
// ============================================
// app/Http/Controllers/Api/Student/StudentDashboardController.php
// ============================================

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use App\Models\Schedule;
use App\Models\StudentTryoutResult;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user()->student;
        $programIds = $student->programs()->pluck('programs.id');

        // 1. Hitung Statistik
        // A. Materi Selesai
        $completedMaterials = $student->materials()
            ->wherePivot('is_completed', true)
            ->count();

        // B. Rata-rata Nilai Tryout
        $avgScore = $student->tryoutResults()->avg('total_score') ?? 0;

        // C. Kehadiran (Hitung persentase kehadiran dari jadwal yang sudah lewat)
        // Ambil semua jadwal kelas yang sudah lewat
        $totalClassesPassed = Schedule::whereIn('program_id', $programIds)
            ->where('type', 'class')
            ->where('start_time', '<', now())
            ->count();
            
        // Ambil jumlah kehadiran siswa
        $totalAttended = $student->attendances()->where('status', 'present')->count();
        
        $attendanceRate = $totalClassesPassed > 0 
            ? round(($totalAttended / $totalClassesPassed) * 100) 
            : 0;

        // 2. Jadwal Akan Datang (Upcoming Schedules)
        $upcomingSchedules = Schedule::with(['subject', 'teacher'])
            ->where('is_active', true)
            ->whereIn('program_id', $programIds) // Sesuaikan program siswa
            ->where('start_time', '>=', now()->startOfDay()) // Mulai hari ini (00:00)
            // HAPUS filter 'type'='class' agar Tryout juga muncul
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get();

        // 3. Hasil Tryout Terakhir
        $recentTryouts = StudentTryoutResult::with('questionPackage')
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'completed_materials' => $completedMaterials,
                    'average_score' => round($avgScore, 1),
                    'attendance_rate' => $attendanceRate,
                ],
                'upcoming_schedules' => $upcomingSchedules, // Nama key disesuaikan dengan Frontend
                'recent_tryouts' => $recentTryouts
            ]
        ]);
    }

    public function progress(Request $request)
    {
        $student = $request->user()->student;

        // 1. Ambil Riwayat Tryout & Format Sesuai Frontend
        $history = $student->tryoutResults()
            ->with(['questionPackage.program']) // Eager load relasi
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($result) {
                return [
                    'id' => $result->id,
                    'package_name' => $result->questionPackage->name ?? 'Paket Tidak Ditemukan',
                    'program_name' => $result->questionPackage->program->name ?? '-',
                    'date' => $result->created_at->translatedFormat('d F Y H:i'), // Format: 20 Mei 2024 10:00
                    'score' => $result->total_score,
                    'is_passed' => (bool) $result->is_passed,
                ];
            });

        // 2. Hitung Statistik Summary
        $totalSeconds = $student->tryoutResults()->sum('duration_seconds');
        
        $summary = [
            // Rata-rata nilai (bulatkan 1 desimal)
            'average_score' => round($student->tryoutResults()->avg('total_score') ?? 0, 1),
            
            // Total Tryout
            'completed_tryouts' => $student->tryoutResults()->count(),
            
            // Konversi detik ke jam (bulatkan 1 desimal)
            'total_study_hours' => round($totalSeconds / 3600, 1),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'history' => $history
            ]
        ]);
    }

    public function feedbacks(Request $request)
    {
        $student = $request->user()->student;

        $feedbacks = $student->feedbacks()
            ->with('admin')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $feedbacks
        ]);
    }
}