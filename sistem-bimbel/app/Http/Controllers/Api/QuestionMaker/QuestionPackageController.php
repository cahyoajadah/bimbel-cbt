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
            'max_attempts' => 'nullable|integer|min:1',
            
            // Validasi Mode & Tanggal
            'execution_mode' => 'required|in:flexible,live',
            'start_date' => 'required_if:execution_mode,live|nullable|date',
            'end_date' => 'required_if:execution_mode,live|nullable|date|after:start_date',
            
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Logic normalisasi data
        $data = $request->all();
        
        // Handle max attempts
        if (isset($data['max_attempts']) && $data['max_attempts'] == 0) {
            $data['max_attempts'] = null;
        }

        // [FIX DATE] Mencegah tanggal mundur di mode Flexible
        // Kita ambil 10 karakter pertama (YYYY-MM-DD) untuk membuang jam/timezone
        if ($request->execution_mode === 'flexible') {
            if (!empty($data['start_date'])) {
                $data['start_date'] = substr($data['start_date'], 0, 10); 
            }
            if (!empty($data['end_date'])) {
                $data['end_date'] = substr($data['end_date'], 0, 10);
            }
        }

        $package = QuestionPackage::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat.',
            'data' => $package
        ], 201);
    }

    public function show($id)
    {
        // Include 'categories' agar frontend bisa merender list kategori
        $package = QuestionPackage::with(['program', 'questions', 'categories'])->findOrFail($id);
        $package->total_questions = $package->questions->count();

        return response()->json(['success' => true, 'data' => $package]);
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
            
            // Validasi Mode & Tanggal
            'execution_mode' => 'required|in:flexible,live',
            'start_date' => 'required_if:execution_mode,live|nullable|date',
            'end_date' => 'required_if:execution_mode,live|nullable|date|after:start_date',
            
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        
        // Handle max attempts
        if (isset($data['max_attempts']) && $data['max_attempts'] == 0) {
            $data['max_attempts'] = null;
        }

        // [FIX DATE] Mencegah tanggal mundur di mode Flexible pada saat UPDATE
        if ($request->execution_mode === 'flexible') {
            if (!empty($data['start_date'])) {
                $data['start_date'] = substr($data['start_date'], 0, 10);
            }
            if (!empty($data['end_date'])) {
                $data['end_date'] = substr($data['end_date'], 0, 10);
            }
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

        return response()->json(['success' => true, 'message' => 'Paket soal berhasil dihapus']);
    }

    // =========================================================================
    // FITUR KATEGORI DINAMIS
    // =========================================================================

    public function addCategory(Request $request, $packageId)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'passing_grade' => 'required|integer|min:0',
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
            'passing_grade' => 'required|integer|min:0',
        ]);

        $category->update($request->only(['name', 'passing_grade']));

        return response()->json(['success' => true, 'message' => 'Kategori diperbarui']);
    }

    public function deleteCategory($packageId, $categoryId)
    {
        $category = QuestionCategory::where('question_package_id', $packageId)
            ->where('id', $categoryId)
            ->firstOrFail();

        // Validasi: Jangan hapus jika ada soal yang terikat
        if ($category->questions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal hapus. Kategori ini sedang digunakan oleh soal.'
            ], 400);
        }

        $category->delete();
        return response()->json(['success' => true, 'message' => 'Kategori dihapus']);
    }
}