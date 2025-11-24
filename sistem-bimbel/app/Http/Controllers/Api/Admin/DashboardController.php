<?php
// ============================================
// app/Http/Controllers/Api/Admin/DashboardController.php
// ============================================

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\Material;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Menghapus 'total_packages' dari return data
        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => Student::count(),
                'total_teachers' => Teacher::count(),
                'total_subjects' => Subject::count(),
                'total_schedules' => Schedule::count(),
                'total_materials' => Material::count(),
            ]
        ]);
    }
}