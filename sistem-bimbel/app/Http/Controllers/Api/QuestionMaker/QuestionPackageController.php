<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\QuestionCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuestionPackageController extends Controller
{
    public function index(Request $request)
    {
        $query = QuestionPackage::with('program');
        
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Urutkan created_at desc agar paket terbaru muncul di atas
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
            'program_id' => 'required|exists:programs,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:0',
            // [FIX] Izinkan 0 (unlimited)
            'max_attempts' => 'nullable|integer|min:0', 
            // [FIX] Validasi Tanggal yang ketat
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ], [
            'end_date.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // [FIX] Konversi max_attempts 0 menjadi NULL (Unlimited)
        $data = $request->all();
        if (isset($data['max_attempts']) && $data['max_attempts'] == 0) {
            $data['max_attempts'] = null;
        }

        $package = QuestionPackage::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat',
            'data' => $package
        ], 201);
    }

    public function show($id)
    {
        $package = QuestionPackage::with(['program', 'questions', 'categories'])
            ->findOrFail($id);
        
        $package->total_questions = $package->questions->count();

        return response()->json([
            'success' => true,
            'data' => $package
        ]);
    }

    public function update(Request $request, $id)
    {
        $package = QuestionPackage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'program_id' => 'required|exists:programs,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:0',
            'max_attempts' => 'nullable|integer|min:0',
            // [FIX] Validasi Tanggal Konsisten
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ], [
            'end_date.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if (isset($data['max_attempts']) && $data['max_attempts'] == 0) {
            $data['max_attempts'] = null;
        }

        $package->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil diperbarui',
            'data' => $package
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

    // =========================================================================
    // FITUR KATEGORI (TIU, TWK, TKP)
    // =========================================================================

    public function addCategory(Request $request, $packageId)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'passing_grade' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $package = QuestionPackage::findOrFail($packageId);

        $category = $package->categories()->create([
            'name' => $request->name,
            'passing_grade' => $request->passing_grade
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $category
        ]);
    }

    public function updateCategory(Request $request, $packageId, $categoryId)
    {
        $category = QuestionCategory::where('question_package_id', $packageId)
            ->where('id', $categoryId)
            ->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'passing_grade' => 'required|numeric|min:0',
        ]);

        $category->update([
            'name' => $request->name,
            'passing_grade' => $request->passing_grade
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Kategori berhasil diperbarui',
            'data' => $category
        ]);
    }

    public function deleteCategory($packageId, $categoryId)
    {
        $category = QuestionCategory::where('question_package_id', $packageId)
            ->where('id', $categoryId)
            ->firstOrFail();

        if ($category->questions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal hapus. Kategori ini masih memiliki soal.'
            ], 400);
        }

        $category->delete();

        return response()->json(['success' => true, 'message' => 'Kategori dihapus']);
    }
}