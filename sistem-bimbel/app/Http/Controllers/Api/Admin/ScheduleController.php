<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['program', 'subject', 'teacher', 'package']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Urutkan dari yang terbaru (jadwal mendatang di atas)
        $schedules = $query->orderBy('start_time', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi menerima 'start_time' & 'end_time' (bukan date/time terpisah)
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:tryout,class',
            'class_type' => 'required_if:type,class|in:zoom,offline',
            'program_id' => 'required|exists:programs,id',
            
            // Validasi subject & teacher: Wajib jika tipe = 'class', Boleh null jika 'tryout'
            'subject_id' => 'required_if:type,class|nullable|exists:subjects,id',
            'teacher_id' => 'required_if:type,class|nullable|exists:teachers,id',
            
            'package_id' => 'nullable|exists:packages,id',
            
            // Validasi Waktu (Datetime String: Y-m-d H:i:s)
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            
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

        DB::beginTransaction();
        try {
            // 2. Logika pembersihan data
            // Jika tryout, hapus subject/teacher agar tidak tersimpan
            $data = $request->all();
            
            if ($request->type === 'tryout') {
                $data['subject_id'] = null;
                $data['teacher_id'] = null;
                $data['class_type'] = null; // Tryout biasanya tidak punya tipe kelas (zoom/offline) spesifik di form ini, atau bisa disesuaikan
            }

            // 3. Simpan Data
            $schedule = Schedule::create($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal berhasil dibuat',
                'data' => $schedule->load(['program', 'subject', 'teacher', 'package'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat jadwal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $schedule = Schedule::with(['program', 'subject', 'teacher', 'package', 'participants'])
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
            
            'subject_id' => 'nullable|exists:subjects,id', // Tidak strict required_if saat update (karena method PUT/PATCH)
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

        DB::beginTransaction();
        try {
            $data = $request->all();

            // Logic null untuk tryout saat update
            if ($request->has('type') && $request->type === 'tryout') {
                $data['subject_id'] = null;
                $data['teacher_id'] = null;
            }

            $schedule->update($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal berhasil diperbarui',
                'data' => $schedule->fresh()->load(['program', 'subject', 'teacher', 'package'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal update jadwal: ' . $e->getMessage()
            ], 500);
        }
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