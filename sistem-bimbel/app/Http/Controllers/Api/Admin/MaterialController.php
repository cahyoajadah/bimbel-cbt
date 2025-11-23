<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        // [PERBAIKAN] Tambahkan with('subject.program')
        // Ini memastikan Laravel mengambil nama Mapel dan Programnya sekaligus
        $query = Material::with('subject.program'); 

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Pastikan urutan berdasarkan order_number
        return response()->json([
            'success' => true,
            'data' => $query->orderBy('order_number', 'asc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,pdf,text',
            'content_url' => 'nullable|string',
            'content_file' => 'nullable|file|mimes:pdf|max:10240', // Validasi PDF
            'description' => 'nullable|string',
            // HAPUS validasi duration_minutes & order
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Handle File Upload
            $contentPath = $request->content_url;
            if ($request->type === 'pdf' && $request->hasFile('content_file')) {
                $contentPath = $request->file('content_file')->store('materials', 'public');
            }

            // AUTO ORDER: Ambil urutan terakhir + 1
            $lastOrder = Material::where('subject_id', $request->subject_id)->max('order_number');
            $newOrder = $lastOrder ? $lastOrder + 1 : 1;

            $material = Material::create([
                'subject_id' => $request->subject_id,
                'title' => $request->title,
                'type' => $request->type,
                'content' => $contentPath,
                'description' => $request->description,
                'order_number' => $newOrder, // Set otomatis
                // JANGAN masukkan duration_minutes di sini
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil dibuat',
                'data' => $material->load('subject')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $material = Material::with('subject')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $material]);
    }

    public function update(Request $request, $id)
    {
        $material = Material::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,pdf,text',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Handle File Update
            if ($request->type === 'pdf' && $request->hasFile('content_file')) {
                // Hapus file lama
                if ($material->type === 'pdf' && $material->content) {
                    Storage::disk('public')->delete($material->content);
                }
                $material->content = $request->file('content_file')->store('materials', 'public');
            } elseif ($request->content_url) {
                $material->content = $request->content_url;
            }

            $material->update([
                'title' => $request->title,
                'type' => $request->type,
                'description' => $request->description,
                // Tidak perlu update order_number atau duration
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil diperbarui',
                'data' => $material->fresh()->load('subject')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $material = Material::findOrFail($id);
        $subjectId = $material->subject_id;
        $deletedOrder = $material->order_number;

        DB::beginTransaction();
        try {
            if ($material->type === 'pdf' && $material->content) {
                Storage::disk('public')->delete($material->content);
            }

            $material->delete();

            // RE-ORDERING: Geser urutan materi setelahnya naik -1
            Material::where('subject_id', $subjectId)
                ->where('order_number', '>', $deletedOrder)
                ->decrement('order_number');

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Materi berhasil dihapus']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}