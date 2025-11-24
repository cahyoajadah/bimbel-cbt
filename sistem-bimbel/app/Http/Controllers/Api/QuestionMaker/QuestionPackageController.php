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
        $query = QuestionPackage::with(['subject', 'creator']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter hanya paket milik user yang login (kecuali admin)
        if ($request->user()->role !== 'admin_manajemen') {
            $query->where('created_by', $request->user()->id);
        }

        $packages = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|exists:subjects,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'class_level' => 'required|integer',
            'program_type' => 'required|in:IPA,IPS,IPC',
            'is_active' => 'boolean',
            // [BARU] Validasi Waktu
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time', // Selesai harus setelah Mulai
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $package = QuestionPackage::create([
            'created_by' => $request->user()->id,
            'subject_id' => $request->subject_id,
            'name' => $request->name,
            'description' => $request->description,
            'class_level' => $request->class_level,
            'program_type' => $request->program_type,
            'is_active' => $request->is_active ?? true,
            // [BARU] Simpan Waktu
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paket soal berhasil dibuat',
            'data' => $package
        ], 201);
    }

    public function show($id)
    {
        $package = QuestionPackage::with(['subject', 'questions'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $package]);
    }

    public function update(Request $request, $id)
    {
        $package = QuestionPackage::findOrFail($id);

        if ($request->user()->id !== $package->created_by && $request->user()->role !== 'admin_manajemen') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'subject_id' => 'sometimes|exists:subjects,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'class_level' => 'sometimes|integer',
            'program_type' => 'sometimes|in:IPA,IPS,IPC',
            'is_active' => 'boolean',
            // [BARU] Validasi Update
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
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
        return response()->json(['success' => true, 'message' => 'Paket soal berhasil dihapus']);
    }
}