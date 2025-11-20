<?php
// ============================================
// app/Http/Controllers/Api/Student/ClassController.php
// ============================================
namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    /**
     * Get all classes
     */
    public function index(Request $request)
    {
        $query = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->with(['program', 'teacher.user']);

        if ($request->has('class_type')) {
            $query->where('class_type', $request->class_type);
        }

        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        $classes = $query->orderBy('start_time', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    /**
     * Get upcoming classes
     */
    public function upcoming(Request $request)
    {
        $classes = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->where('start_time', '>=', now())
            ->with(['program', 'teacher.user'])
            ->orderBy('start_time')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    /**
     * Join class (get Zoom link)
     */
    public function join(Request $request, $id)
    {
        $student = $request->user()->student;
        $class = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->findOrFail($id);

        if ($class->class_type !== 'zoom' || !$class->zoom_link) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas ini tidak memiliki link Zoom'
            ], 400);
        }

        // Record participation
        $class->participants()->syncWithoutDetaching([
            $student->id => [
                'is_attended' => true,
                'attended_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil join kelas',
            'data' => [
                'zoom_link' => $class->zoom_link,
                'class' => $class,
            ]
        ]);
    }

    /**
     * Get schedules (both tryout and class)
     */
    public function schedules(Request $request)
    {
        $query = Schedule::where('is_active', true)
            ->with(['program', 'teacher.user']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('class_type')) {
            $query->where('class_type', $request->class_type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('start_time', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('start_time', '<=', $request->end_date);
        }

        $schedules = $query->orderBy('start_time')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }
}