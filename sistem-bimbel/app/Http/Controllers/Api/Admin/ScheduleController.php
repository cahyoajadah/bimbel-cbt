<?php
// ============================================
// app/Http/Controllers/Api/Admin/ScheduleController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['program', 'teacher', 'package']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        $schedules = $query->orderBy('start_time', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:tryout,class',
            'class_type' => 'required_if:type,class|in:zoom,offline',
            'program_id' => 'nullable|exists:programs,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'package_id' => 'nullable|exists:packages,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'zoom_link' => 'required_if:class_type,zoom|nullable|url',
            'location' => 'required_if:class_type,offline|nullable|string',
            'max_participants' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule = Schedule::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dibuat',
            'data' => $schedule->load(['program', 'teacher', 'package'])
        ], 201);
    }

    public function show($id)
    {
        $schedule = Schedule::with(['program', 'teacher', 'package', 'participants'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $schedule
        ]);
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:tryout,class',
            'class_type' => 'nullable|in:zoom,offline',
            'program_id' => 'nullable|exists:programs,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'package_id' => 'nullable|exists:packages,id',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'zoom_link' => 'nullable|url',
            'location' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diperbarui',
            'data' => $schedule->fresh()->load(['program', 'teacher', 'package'])
        ]);
    }

    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus'
        ]);
    }
}