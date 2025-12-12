<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\StudentTryoutResult;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user()->student;
        $programIds = $student->programs()->pluck('programs.id');

        // 1. Statistik Dashboard
        $completedMaterials = $student->materials()
            ->wherePivot('is_completed', true)
            ->count();

        $avgScore = $student->tryoutResults()->avg('total_score') ?? 0;

        // Hitung Kehadiran
        $totalClassesPassed = Schedule::whereIn('program_id', $programIds)
            ->where('type', 'class')
            ->where('start_time', '<', now())
            ->count();
            
        $totalAttended = $student->attendances()->where('status', 'present')->count();
        
        $attendanceRate = $totalClassesPassed > 0 
            ? round(($totalAttended / $totalClassesPassed) * 100) 
            : 0;

        // 2. Jadwal Akan Datang
        $upcomingSchedules = Schedule::with(['subject', 'teacher'])
            ->where('is_active', true)
            ->whereIn('program_id', $programIds)
            ->where('start_time', '>=', now()->startOfDay()) 
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get();

        // 3. Hasil Tryout Terakhir (Ringkasan di Dashboard)
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
                'upcoming_schedules' => $upcomingSchedules,
                'recent_tryouts' => $recentTryouts
            ]
        ]);
    }

    // [FIX] Method Progress Lengkap
    public function progress(Request $request)
    {
        $student = $request->user()->student;

        // 1. Ambil Riwayat Tryout
        $history = $student->tryoutResults()
            // Load relasi questions untuk hitung max_score
            ->with(['questionPackage.program', 'questionPackage.questions'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($result) {
                $pkg = $result->questionPackage;
                
                // a. Gunakan status kelulusan ASLI dari database (hasil hitungan CBTController)
                $isPassed = (bool) $result->is_passed;

                // b. Hitung Total Skor Maksimal Paket (Sum poin semua soal)
                $maxScore = $pkg ? $pkg->questions->sum('point') : 0;

                // c. Decode JSON category_scores agar bisa dibaca frontend
                // Pastikan handle null jika data lama belum punya kategori
                $categoryScores = $result->category_scores ? json_decode($result->category_scores) : [];

                return [
                    'id' => $result->id,
                    'package_id' => $pkg->id ?? null, // [PENTING] Untuk link ke halaman Ranking
                    'package_name' => $pkg->name ?? 'Paket Tidak Ditemukan',
                    'program_name' => $pkg->program->name ?? '-',
                    'date' => $result->created_at->translatedFormat('d F Y H:i'),
                    'score' => $result->total_score,
                    'max_score' => $maxScore, 
                    'is_passed' => $isPassed,
                    'category_scores' => $categoryScores, // [PENTING] Data nilai per kategori
                ];
            });

        // 2. Statistik Summary
        $summary = [
            'average_score' => round($student->tryoutResults()->avg('total_score') ?? 0, 1),
            'completed_tryouts' => $student->tryoutResults()->count(),
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
        return response()->json(['success' => true, 'data' => $student->feedbacks]);
    }
}