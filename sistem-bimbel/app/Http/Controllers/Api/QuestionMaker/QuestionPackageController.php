<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
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
            
            // Validasi Passing Grade Kategori
            'passing_grade_twk' => 'nullable|integer|min:0',
            'passing_grade_tiu' => 'nullable|integer|min:0',
            'passing_grade_tkp' => 'nullable|integer|min:0',
            
            'max_attempts' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // [FIX] Ambil semua data request, lalu set default untuk passing grade jika kosong
        $data = $request->all();
        $data['passing_grade_twk'] = $request->input('passing_grade_twk', 0);
        $data['passing_grade_tiu'] = $request->input('passing_grade_tiu', 0);
        $data['passing_grade_tkp'] = $request->input('passing_grade_tkp', 0);

        // Buat paket dengan SEMUA data
        $package = QuestionPackage::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat',
            'data' => $package
        ], 201);
    }

    public function show($id)
    {
        $package = QuestionPackage::with(['program', 'questions'])->findOrFail($id);
        
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
            
            'passing_grade_twk' => 'nullable|integer|min:0',
            'passing_grade_tiu' => 'nullable|integer|min:0',
            'passing_grade_tkp' => 'nullable|integer|min:0',
            
            'max_attempts' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // [FIX] Sama seperti store, ambil semua data lalu merge default
        $data = $request->all();
        $data['passing_grade_twk'] = $request->input('passing_grade_twk', 0);
        $data['passing_grade_tiu'] = $request->input('passing_grade_tiu', 0);
        $data['passing_grade_tkp'] = $request->input('passing_grade_tkp', 0);

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
}