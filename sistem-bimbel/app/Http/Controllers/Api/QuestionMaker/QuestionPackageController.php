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
            // [BARU] Validasi Tanggal
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
        $package = QuestionPackage::with(['program', 'questions'])->findOrFail($id);
        
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
            // [BARU] Validasi Tanggal
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
}