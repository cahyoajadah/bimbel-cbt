<?php
// ============================================
// app/Http/Controllers/Api/Admin/DashboardController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Package;
use App\Models\Material;

class DashboardController extends Controller
{
    public function index()
    {
        $data = [
            'total_siswa' => Student::count(),
            'total_pembimbing' => Teacher::count(),
            'total_paket_tryout' => Package::count(),
            'total_materi' => Material::count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
