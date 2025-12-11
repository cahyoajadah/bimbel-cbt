<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\QuestionPackage; 
use App\Models\QuestionReport; 

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // KITA TIDAK BISA FILTER USER KARENA KOLOMNYA TIDAK ADA DI MIGRATION
        // Jadi kita ambil data secara GLOBAL (Semua paket yang ada)

        // 1. Hitung Total Semua Paket Soal
        $totalPackages = QuestionPackage::count();
        
        // 2. Hitung Paket Aktif
        $activePackages = QuestionPackage::where('is_active', true)->count();

        // 3. Hitung Laporan Masalah
        // Kita gunakan try-catch agar aman jika tabel report belum siap
        try {
            $pendingReports = QuestionReport::where('status', 'pending')->count();
        } catch (\Exception $e) {
            $pendingReports = 0;
        }

        // 4. Ambil 5 Paket Terakhir (Secara Global)
        $recentPackages = QuestionPackage::latest()
                            ->limit(5)
                            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_packages' => $totalPackages,
                    'active_packages' => $activePackages,
                    'pending_reports' => $pendingReports,
                ],
                'recent_packages' => $recentPackages
            ]
        ]);
    }
}