<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // [WAJIB] Import Storage
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        // Eager load subject & program agar nama mapel muncul di tabel
        $query = Material::with('subject.program');

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Urutkan berdasarkan order_number
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
        'content_file' => 'required_if:type,pdf|file|mimes:pdf|max:10240',
        'content_url' => 'required_if:type,video,text|nullable|string',
        'description' => 'nullable|string',
        'can_download' => 'boolean' // Validasi boolean
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    DB::beginTransaction();
    try {
        $contentPath = null;

        if ($request->type === 'pdf' && $request->hasFile('content_file')) {
            $contentPath = $request->file('content_file')->store('materials', 'public');
        } else {
            $contentPath = $request->content_url;
        }

        $lastOrder = Material::where('subject_id', $request->subject_id)->max('order_number');
        $newOrder = $lastOrder ? $lastOrder + 1 : 1;

        $material = Material::create([
            'subject_id' => $request->subject_id,
            'title' => $request->title,
            'type' => $request->type,
            'content' => $contentPath,
            'description' => $request->description,
            'order_number' => $newOrder,
            'is_active' => true,
            // [PERBAIKAN] Ambil value boolean secara eksplisit dan simpan
            'can_download' => $request->boolean('can_download', false),
        ]);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil dibuat',
            'data' => $material->load('subject')
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        if (isset($contentPath) && $request->type === 'pdf') {
            Storage::disk('public')->delete($contentPath);
        }
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
        'content_file' => 'nullable|file|mimes:pdf|max:10240',
        'content_url' => 'nullable|string',
        'can_download' => 'boolean' // [PERBAIKAN] Tambahkan validasi ini
    ]);

    if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

    DB::beginTransaction();
    try {
        $newContent = $material->content;
        $oldContent = $material->content;
        $oldType = $material->type;

        if ($request->type === 'pdf' && $request->hasFile('content_file')) {
            $newContent = $request->file('content_file')->store('materials', 'public');
            if ($oldType === 'pdf' && $oldContent) {
                Storage::disk('public')->delete($oldContent);
            }
        } elseif ($request->content_url) {
            $newContent = $request->content_url;
            if ($oldType === 'pdf' && $oldContent) {
                Storage::disk('public')->delete($oldContent);
            }
        }

        $material->update([
            'title' => $request->title,
            'type' => $request->type,
            'content' => $newContent,
            'description' => $request->description,
            // [PERBAIKAN] Update kolom can_download
            'can_download' => $request->boolean('can_download'),
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
            // [LOGIKA PEMBERSIHAN FILE SAAT DELETE]
            // Hapus file fisik jika tipenya PDF
            if ($material->type === 'pdf' && $material->content) {
                if (Storage::disk('public')->exists($material->content)) {
                    Storage::disk('public')->delete($material->content);
                }
            }

            $material->delete();

            // RE-ORDERING: Geser urutan materi setelahnya agar tidak bolong
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