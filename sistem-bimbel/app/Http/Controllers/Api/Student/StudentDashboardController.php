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

        // 1. Hitung Statistik Dashboard
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

        // 2. Jadwal Akan Datang (Kelas & Tryout)
        $upcomingSchedules = Schedule::with(['subject', 'teacher'])
            ->where('is_active', true)
            ->whereIn('program_id', $programIds)
            ->where('start_time', '>=', now()->startOfDay()) 
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
                'upcoming_schedules' => $upcomingSchedules,
                'recent_tryouts' => $recentTryouts
            ]
        ]);
    }

    // [PERBAIKAN METHOD PROGRESS]
    public function progress(Request $request)
    {
        $student = $request->user()->student;

        // 1. Ambil Riwayat Tryout & Format Sesuai Frontend
        $history = $student->tryoutResults()
            ->with(['questionPackage.program'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($result) {
                
                // [FIX LOGIKA LULUS]: Hitung ulang status Lulus berdasarkan Nilai vs KKM
                // Ini memperbaiki data lama yang mungkin salah status
                $passingScore = $result->questionPackage->passing_score ?? 0;
                $isPassed = $result->total_score >= $passingScore;

                return [
                    'id' => $result->id,
                    'package_name' => $result->questionPackage->name ?? 'Paket Tidak Ditemukan',
                    'program_name' => $result->questionPackage->program->name ?? '-',
                    'date' => $result->created_at->translatedFormat('d F Y H:i'),
                    'score' => $result->total_score,
                    'is_passed' => $isPassed, // Gunakan hasil perhitungan baru
                ];
            });

        // 2. Hitung Statistik Summary (Tanpa Jam Belajar)
        $summary = [
            'average_score' => round($student->tryoutResults()->avg('total_score') ?? 0, 1),
            'completed_tryouts' => $student->tryoutResults()->count(),
            // 'total_study_hours' dihapus
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