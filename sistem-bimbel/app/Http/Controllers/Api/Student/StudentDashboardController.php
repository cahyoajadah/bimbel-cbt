<?php
// ============================================
// app/Http/Controllers/Api/Student/StudentDashboardController.php
// ============================================

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use App\Models\Schedule;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user()->student;

        $data = [
            'latest_materials' => Material::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'latest_classes' => Schedule::where('type', 'class')
                ->where('is_active', true)
                ->where('start_time', '>=', now())
                ->orderBy('start_time')
                ->limit(5)
                ->get(),
            'learning_progress' => [
                'completed_materials' => $student->materials()
                    ->wherePivot('is_completed', true)
                    ->count(),
                'total_materials' => $student->materials()->count(),
            ],
            'last_tryout_score' => $student->last_tryout_score,
        ];

        return response()->json([
            'success' => true,
            'data' => $data
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