<?php

namespace App\Http\Controllers\Api\Public; // [UBAH] Namespace jadi Public

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\StudentTryoutResult;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    public function getPackageRanking(Request $request, $packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);

        // Ambil hasil terbaik per siswa (Skor Tertinggi, jika seri ambil Waktu Tercepat)
        $rankings = StudentTryoutResult::with('student.user')
            ->where('question_package_id', $packageId)
            ->selectRaw('student_id, MAX(total_score) as best_score, MIN(duration_seconds) as best_time, MAX(created_at) as latest_attempt')
            ->groupBy('student_id')
            ->orderByDesc('best_score')
            ->orderBy('best_time')
            ->limit(100) // Top 100
            ->get()
            ->map(function ($result, $index) {
                return [
                    'rank' => $index + 1,
                    'student_name' => $result->student->user->name ?? 'Siswa',
                    'school' => $result->student->school_origin ?? '-',
                    'score' => $result->best_score,
                    'duration' => gmdate("H:i:s", $result->best_time), // Format jam:menit:detik
                    'date' => $result->latest_attempt->format('d M Y'),
                ];
            });

        // Cari posisi user yang sedang login (jika role siswa)
        $myRank = null;
        // Cek apakah user login dan punya data student
        if ($request->user() && $request->user()->student) {
            $studentName = $request->user()->name;
            
            // Cari data saya di list ranking yang sudah di-map di atas
            $myRank = $rankings->first(function ($item) use ($studentName) {
                return $item['student_name'] === $studentName;
            });
        }

        return response()->json([
            'success' => true,
            'package_name' => $package->name,
            'data' => $rankings,
            'my_rank' => $myRank
        ]);
    }
}