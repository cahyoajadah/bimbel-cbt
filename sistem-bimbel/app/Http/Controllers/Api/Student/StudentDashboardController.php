<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\StudentTryoutResult;

class StudentDashboardController extends Controller
{
    // ... method index tetap sama ...
    public function index(Request $request)
    {
        $student = $request->user()->student;
        $programIds = $student->programs()->pluck('programs.id');

        // Statistik Dashboard
        $completedMaterials = $student->materials()->wherePivot('is_completed', true)->count();
        $avgScore = $student->tryoutResults()->avg('total_score') ?? 0;

        // Kehadiran
        $totalClassesPassed = Schedule::whereIn('program_id', $programIds)
            ->where('type', 'class')->where('start_time', '<', now())->count();
        $totalAttended = $student->attendances()->where('status', 'present')->count();
        $attendanceRate = $totalClassesPassed > 0 ? round(($totalAttended / $totalClassesPassed) * 100) : 0;

        // Jadwal & Tryout Terakhir
        $upcomingSchedules = Schedule::with(['subject', 'teacher'])
            ->where('is_active', true)->whereIn('program_id', $programIds)
            ->where('start_time', '>=', now()->startOfDay())
            ->orderBy('start_time', 'asc')->limit(5)->get();

        $recentTryouts = StudentTryoutResult::with('questionPackage')
            ->where('student_id', $student->id)->orderBy('created_at', 'desc')->limit(5)->get();

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

    public function progress(Request $request)
    {
        $student = $request->user()->student;

        $history = $student->tryoutResults()
            ->with(['questionPackage.program', 'questionPackage.questions'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($result) {
                $pkg = $result->questionPackage;
                $maxScore = $pkg ? $pkg->questions->sum('point') : 0;

                // [FIX] Decode category_scores dari JSON string ke Array
                $categoryScores = $result->category_scores ? json_decode($result->category_scores) : [];

                return [
                    'id' => $result->id,
                    'package_id' => $pkg->id ?? null, // Tambahkan ID Paket untuk link ranking
                    'package_name' => $pkg->name ?? 'Paket Tidak Ditemukan',
                    'program_name' => $pkg->program->name ?? '-',
                    'date' => $result->created_at->translatedFormat('d F Y H:i'),
                    'score' => $result->total_score,
                    'max_score' => $maxScore,
                    'is_passed' => (bool) $result->is_passed,
                    // [BARU] Kirim detail nilai kategori
                    'category_scores' => $categoryScores 
                ];
            });

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
    
    // ... method feedbacks tetap sama ...
    public function feedbacks(Request $request)
    {
        $student = $request->user()->student;
        return response()->json(['success' => true, 'data' => $student->feedbacks]);
    }
}