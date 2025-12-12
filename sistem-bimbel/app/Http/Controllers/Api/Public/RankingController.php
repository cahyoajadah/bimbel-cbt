<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\StudentTryoutResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RankingController extends Controller
{
    public function getPackageRanking(Request $request, $packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);

        // 1. Ambil 100 Siswa Terbaik
        $query = StudentTryoutResult::with('student.user')
            ->where('question_package_id', $packageId)
            ->selectRaw('student_id, MAX(total_score) as best_score, MIN(duration_seconds) as best_time, MAX(created_at) as latest_attempt')
            ->groupBy('student_id')
            ->orderByDesc('best_score')
            ->orderBy('best_time')
            ->limit(100);

        $rankings = $query->get()->map(function ($result, $index) {
            $dateStr = $result->latest_attempt;
            $dateObj = $dateStr ? Carbon::parse($dateStr) : null;
            $schoolName = $result->student->school ?? $result->student->school_origin ?? '-';
            
            // [FIX] Gunakan abs() agar durasi tidak negatif (penyebab 23 jam)
            $seconds = abs($result->best_time);
            $formattedDuration = gmdate("H:i:s", $seconds);

            return [
                'rank' => $index + 1,
                'student_name' => $result->student->user->name ?? 'Siswa',
                'school' => $schoolName,
                'score' => $result->best_score,
                'duration' => $formattedDuration,
                'date' => $dateObj ? $dateObj->format('d M Y') : '-', 
                'student_id' => $result->student_id,
            ];
        });

        // 2. Cari Posisi User Login
        $myRank = null;
        if ($request->user() && $request->user()->student) {
            $studentId = $request->user()->student->id;
            
            $inTop100 = $rankings->firstWhere('student_id', $studentId);

            if ($inTop100) {
                $myRank = $inTop100;
            } else {
                $myResult = StudentTryoutResult::where('student_id', $studentId)
                    ->where('question_package_id', $packageId)
                    ->orderByDesc('total_score')
                    ->orderBy('duration_seconds')
                    ->first();

                if ($myResult) {
                    $betterScoreCount = StudentTryoutResult::where('question_package_id', $packageId)
                        ->select('student_id')
                        ->groupBy('student_id')
                        ->havingRaw('MAX(total_score) > ?', [$myResult->total_score])
                        ->get()
                        ->count();

                    $sameScoreBetterTime = StudentTryoutResult::where('question_package_id', $packageId)
                        ->select('student_id')
                        ->groupBy('student_id')
                        ->havingRaw('MAX(total_score) = ? AND MIN(duration_seconds) < ?', [$myResult->total_score, $myResult->duration_seconds])
                        ->get()
                        ->count();

                    $schoolName = $request->user()->student->school ?? $request->user()->student->school_origin ?? '-';

                    // [FIX] Format durasi ranking user sendiri
                    $mySeconds = abs($myResult->duration_seconds);
                    
                    $myRank = [
                        'rank' => $betterScoreCount + $sameScoreBetterTime + 1,
                        'student_name' => $request->user()->name,
                        'school' => $schoolName,
                        'score' => $myResult->total_score,
                        'duration' => gmdate("H:i:s", $mySeconds),
                        'date' => $myResult->created_at->format('d M Y'),
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'package_name' => $package->name,
            'data' => $rankings,
            'my_rank' => $myRank
        ]);
    }
}