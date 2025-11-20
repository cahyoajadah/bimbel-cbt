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

        $data = [
            'materials_progress' => $student->materials()
                ->withPivot('is_completed', 'progress_percentage')
                ->get(),
            'tryout_history' => $student->tryoutResults()
                ->with('questionPackage')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'last_tryout_score' => $student->last_tryout_score,
        ];

        return response()->json([
            'success' => true,
            'data' => $data
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