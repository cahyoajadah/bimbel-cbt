<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = Program::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%') // Cari by code juga
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }
        
        // Jika ada parameter 'all=true', kembalikan semua (untuk dropdown)
        if ($request->has('all') && $request->all == 'true') {
            $programs = $query->orderBy('name', 'asc')->get();
            return response()->json(['success' => true, 'data' => $programs]);
        }

        $programs = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $programs
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:programs,code', //Validasi Code
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program = Program::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Program berhasil dibuat',
            'data' => $program
        ], 201);
    }

    public function show($id)
    {
        $program = Program::findOrFail($id);
        return response()->json(['success' => true, 'data' => $program]);
    }

    public function update(Request $request, $id)
    {
        $program = Program::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:programs,code,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Program berhasil diperbarui',
            'data' => $program
        ]);
    }

    public function destroy($id)
    {
        $program = Program::findOrFail($id);
        // Cek relasi sebelum hapus
        if ($program->students()->exists() || $program->questionPackages()->exists()) {
            return response()->json([
                'success' => false, 
                'message' => 'Gagal hapus: Program sedang digunakan oleh siswa atau paket soal.'
            ], 400);
        }

        $program->delete();

        return response()->json([
            'success' => true,
            'message' => 'Program berhasil dihapus'
        ]);
    }
}