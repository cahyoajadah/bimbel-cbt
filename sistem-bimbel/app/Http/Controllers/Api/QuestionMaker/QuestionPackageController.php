<?php
// ============================================
// app/Http/Controllers/Api/QuestionMaker/QuestionPackageController.php
// ============================================
namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuestionPackageController extends Controller
{
    public function index(Request $request)
    {
        $query = QuestionPackage::with('program', 'creator');

        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        $packages = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'program_id' => 'required|exists:programs,id',
            'duration_minutes' => 'required|integer|min:1',
            'passing_score' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $package = QuestionPackage::create([
            ...$request->all(),
            'created_by' => $request->user()->id,
            'total_questions' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat',
            'data' => $package->load('program')
        ], 201);
    }

    public function show($id)
    {
        $package = QuestionPackage::with(['program', 'creator', 'questions.answerOptions'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $package
        ]);
    }

    public function update(Request $request, $id)
    {
        $package = QuestionPackage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'program_id' => 'sometimes|exists:programs,id',
            'duration_minutes' => 'sometimes|integer|min:1',
            'passing_score' => 'nullable|numeric|min:0',
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
            'message' => 'Paket soal berhasil diperbarui',
            'data' => $package->fresh()->load('program')
        ]);
    }

    public function destroy($id)
    {
        $package = QuestionPackage::findOrFail($id);
        $package->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dihapus'
        ]);
    }
}