<?php
// ============================================
// app/Http/Controllers/Api/Admin/PackageController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PackageController extends Controller
{
    /**
     * Get all packages
     */
    public function index(Request $request)
    {
        $query = Package::with('program');

        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $packages = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    /**
     * Create package
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'program_id' => 'required|exists:programs,id',
            'duration_days' => 'nullable|integer',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $package = Package::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil dibuat',
            'data' => $package->load('program')
        ], 201);
    }

    /**
     * Show package detail
     */
    public function show($id)
    {
        $package = Package::with('program', 'students')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $package
        ]);
    }

    /**
     * Update package
     */
    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'program_id' => 'sometimes|exists:programs,id',
            'duration_days' => 'nullable|integer',
            'price' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $package->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil diperbarui',
            'data' => $package->fresh()->load('program')
        ]);
    }

    /**
     * Delete package
     */
    public function destroy($id)
    {
        $package = Package::findOrFail($id);
        $package->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil dihapus'
        ]);
    }

    /**
     * Assign package to students
     */
    public function assignToStudents(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $package = Package::findOrFail($id);

        $syncData = [];
        foreach ($request->student_ids as $studentId) {
            $syncData[$studentId] = [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $package->students()->syncWithoutDetaching($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil di-assign ke siswa'
        ]);
    }
}
