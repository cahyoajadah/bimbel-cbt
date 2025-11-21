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
     * Get all classes (Filtered by Student Program)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        // 1. Ambil ID Program milik Siswa
        $studentProgramIds = $student->programs()->pluck('programs.id');

        // 2. Filter Jadwal berdasarkan Program Siswa
        $query = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds) // <--- FILTER OTOMATIS DI SINI
            ->with(['program', 'teacher.user']);

        if ($request->has('class_type')) {
            $query->where('class_type', $request->class_type);
        }

        $classes = $query->orderBy('start_time', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    /**
     * Get upcoming classes (Filtered by Student Program)
     */
    public function upcoming(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['data' => []]);
        }

        $studentProgramIds = $student->programs()->pluck('programs.id');

        $classes = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds) // <--- FILTER OTOMATIS
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
     * Join class (Check permission)
     */
    public function join(Request $request, $id)
    {
        $student = $request->user()->student;
        $studentProgramIds = $student->programs()->pluck('programs.id');

        // Pastikan kelas yang mau di-join sesuai program siswa
        $class = Schedule::where('type', 'class')
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds) // <--- VALIDASI AKSES
            ->findOrFail($id);

        if ($class->class_type !== 'zoom' || !$class->zoom_link) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas ini tidak memiliki link Zoom'
            ], 400);
        }

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
     * Get all schedules (Tryout & Class) - Filtered
     */
    public function schedules(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['data' => []]);
        }

        $studentProgramIds = $student->programs()->pluck('programs.id');

        $query = Schedule::where('is_active', true)
            ->whereIn('program_id', $studentProgramIds) // <--- FILTER OTOMATIS
            ->with(['program', 'teacher.user']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('class_type')) {
            $query->where('class_type', $request->class_type);
        }

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