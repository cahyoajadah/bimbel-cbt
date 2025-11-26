<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('specialization', 'like', "%{$search}%");
        }

        // Langsung sort berdasarkan nama di tabel teachers
        $teachers = $query->orderBy('name', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $teachers
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255', // Tidak harus unique di users lagi
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Simpan langsung ke Teacher
        $teacher = Teacher::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pembimbing berhasil dibuat',
            'data' => $teacher
        ], 201);
    }

    public function show($id)
    {
        $teacher = Teacher::findOrFail($id);
        return response()->json(['success' => true, 'data' => $teacher]);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $teacher->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pembimbing berhasil diperbarui',
            'data' => $teacher
        ]);
    }

    public function destroy($id)
    {
        $teacher = Teacher::findOrFail($id);
        $teacher->delete();
        return response()->json(['success' => true, 'message' => 'Pembimbing berhasil dihapus']);
    }
}