<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\StudentTryoutResult;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    // API: GET /rankings/packages
    // Mengambil daftar paket yang pernah dikerjakan siswa (untuk dropdown filter)
    public function index(Request $request)
    {
        $student = $request->user()->student;
        
        // Ambil paket yang SUDAH pernah dikerjakan oleh siswa ini
        $myPackages = QuestionPackage::whereHas('tryoutResults', function($q) use ($student) {
            $q->where('student_id', $student->id);
        })
        ->select('id', 'name')
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $myPackages
        ]);
    }

    // API: GET /rankings/{packageId}
    // Mengambil data peringkat top 50 + peringkat user sendiri
    // API: GET /rankings/{packageId}
    public function show(Request $request, $packageId)
    {
        $student = $request->user()->student;
        
        // 1. Ambil SEMUA hasil untuk paket ini (Sorted by Best Score)
        // Kita menggunakan get() tanpa limit dulu agar bisa memfilter unique user di PHP
        $allResults = StudentTryoutResult::with('student.user')
            ->where('question_package_id', $packageId)
            ->orderBy('total_score', 'desc')     // Prioritas 1: Skor Tinggi
            ->orderBy('duration_seconds', 'asc') // Prioritas 2: Waktu Cepat
            ->orderBy('created_at', 'asc')       // Prioritas 3: Submit Duluan
            ->get();

        // 2. Filter: Hanya ambil 1 hasil terbaik per siswa
        // Fungsi unique('student_id') akan mempertahankan data PERTAMA yang ditemukan 
        // (yang mana adalah skor terbaik karena sudah di-sort di atas)
        $uniqueResults = $allResults->unique('student_id')->values();

        // 3. Ambil Top 50 dari data yang sudah unik
        $top50 = $uniqueResults->take(50);
        
        $rankings = [];
        foreach ($top50 as $index => $res) {
            $rankings[] = [
                'rank' => $index + 1,
                'student_name' => $res->student->user->name ?? 'Siswa',
                'student_id' => $res->student_id,
                'score' => $res->total_score,
                'duration' => $res->duration_seconds,
                'is_me' => $res->student_id === $student->id,
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($res->student->user->name ?? 'S') . '&background=random'
            ];
        }

        // 4. Cari Posisi User Sendiri (Dari list unique yang lengkap)
        $myRank = null;
        
        // Cari index siswa di dalam koleksi unik
        $myIndex = $uniqueResults->search(function ($item) use ($student) {
            return $item->student_id === $student->id;
        });

        if ($myIndex !== false) {
            // Jika ketemu, ambil datanya
            $myResultData = $uniqueResults[$myIndex];
            
            $myRank = [
                'rank' => $myIndex + 1, // Index dimulai dari 0, jadi ranking +1
                'score' => $myResultData->total_score,
                'duration' => $myResultData->duration_seconds,
                'student_name' => $request->user()->name,
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->user()->name) . '&background=0D8ABC&color=fff'
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'package_id' => (int)$packageId,
                'rankings' => $rankings,
                'my_rank' => $myRank
            ]
        ]);
    }
}