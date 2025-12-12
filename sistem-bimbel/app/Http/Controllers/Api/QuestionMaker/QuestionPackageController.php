<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\QuestionCategory; // Pastikan model ini sudah di-import
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
            'passing_score' => 'required|integer|min:0', // Passing grade global (akumulasi)
            'max_attempts' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $package = QuestionPackage::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat',
            'data' => $package
        ], 201);
    }

    public function show($id)
    {
        // [UPDATE] Kita tambahkan 'categories' di sini agar muncul di respon
        $package = QuestionPackage::with(['program', 'questions', 'categories'])
            ->findOrFail($id);
        
        // Tambahkan atribut total_questions
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
            'max_attempts' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $package->update($request->all());

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
    // FITUR BARU: MANAJEMEN KATEGORI (TIU, TWK, TKP, dll)
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

        // Cek apakah ada soal yang menggunakan kategori ini
        if ($category->questions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal hapus. Masih ada soal di kategori ini. Pindahkan atau hapus soal terlebih dahulu.'
            ], 400);
        }

        $category->delete();

        return response()->json(['success' => true, 'message' => 'Kategori dihapus']);
    }
}