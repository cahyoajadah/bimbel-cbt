<?php
// ============================================
// app/Http/Controllers/Api/Admin/MaterialController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    /**
     * Get all materials
     */
    public function index(Request $request)
    {
        $query = Material::with('subject');

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $materials = $query->orderBy('order')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $materials
        ]);
    }

    /**
     * Create material
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:video,pdf',
            'content' => 'required_if:type,video|nullable|url', // YouTube URL
            'pdf_file' => 'required_if:type,pdf|nullable|file|mimes:pdf|max:10240',
            'order' => 'nullable|integer',
            'duration_minutes' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('pdf_file');

        // Handle PDF upload
        if ($request->type === 'pdf' && $request->hasFile('pdf_file')) {
            $path = $request->file('pdf_file')->store('materials/pdf', 'public');
            $data['content'] = $path;
        }

        $material = Material::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil dibuat',
            'data' => $material->load('subject')
        ], 201);
    }

    /**
     * Show material detail
     */
    public function show($id)
    {
        $material = Material::with('subject', 'students')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $material
        ]);
    }

    /**
     * Update material
     */
    public function update(Request $request, $id)
    {
        $material = Material::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'subject_id' => 'sometimes|exists:subjects,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:video,pdf',
            'content' => 'required_if:type,video|nullable|url',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
            'order' => 'nullable|integer',
            'duration_minutes' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('pdf_file');

        // Handle PDF upload
        if ($request->hasFile('pdf_file')) {
            // Delete old file
            if ($material->type === 'pdf' && $material->content) {
                Storage::disk('public')->delete($material->content);
            }
            
            $path = $request->file('pdf_file')->store('materials/pdf', 'public');
            $data['content'] = $path;
        }

        $material->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil diperbarui',
            'data' => $material->fresh()->load('subject')
        ]);
    }

    /**
     * Delete material
     */
    public function destroy($id)
    {
        $material = Material::findOrFail($id);

        // Delete file if PDF
        if ($material->type === 'pdf' && $material->content) {
            Storage::disk('public')->delete($material->content);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil dihapus'
        ]);
    }

    /**
     * Assign material to students
     */
    public function assignToStudents(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $material = Material::findOrFail($id);

        $syncData = [];
        foreach ($request->student_ids as $studentId) {
            $syncData[$studentId] = [
                'is_completed' => false,
                'progress_percentage' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $material->students()->syncWithoutDetaching($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil di-assign ke siswa'
        ]);
    }
}