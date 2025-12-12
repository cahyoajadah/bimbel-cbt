<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\StudentTryoutResult;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    // 1. Ambil daftar paket yang sudah dikerjakan oleh siswa ini
    public function index(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Invalid student'], 403);
        }

        // Cari ID paket yang sudah pernah dikerjakan (ada di tabel result)
        $packageIds = StudentTryoutResult::where('student_id', $student->id)
            ->pluck('question_package_id')
            ->unique();

        $packages = QuestionPackage::whereIn('id', $packageIds)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name', 'program_id', 'passing_score')
            ->with('program:id,name') // Load nama program
            ->get();

        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    // 2. Ambil data ranking untuk satu paket spesifik
    public function show(Request $request, $packageId)
    {
        // Ambil hasil semua siswa di paket ini, urutkan berdasarkan skor tertinggi
        // Jika skor sama, urutkan berdasarkan durasi tercepat (optional)
        $results = StudentTryoutResult::with(['student.user'])
            ->where('question_package_id', $packageId)
            ->orderByDesc('total_score')
            ->orderBy('duration_seconds', 'asc') 
            ->get()
            ->map(function ($result, $index) use ($request) {
                $isCurrentUser = $result->student_id == $request->user()->student->id;
                
                return [
                    'rank' => $index + 1,
                    'student_name' => $result->student->user->name ?? 'Unknown',
                    'is_me' => $isCurrentUser, // Flag untuk highlight user sendiri
                    'total_score' => $result->total_score,
                    'score_twk' => $result->score_twk,
                    'score_tiu' => $result->score_tiu,
                    'score_tkp' => $result->score_tkp,
                    'is_passed' => $result->is_passed,
                    'date' => $result->created_at->format('d M Y'),
                ];
            });

        $package = QuestionPackage::find($packageId);

        return response()->json([
            'success' => true,
            'data' => [
                'package_name' => $package->name,
                'rankings' => $results
            ]
        ]);
    }
}