<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        // Load relasi program agar tampil di tabel
        $query = Announcement::with('program');
        
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        $announcements = $query->orderBy('created_at', 'desc')->paginate(10);
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
            'program_id' => 'nullable|exists:programs,id' // [BARU]
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $announcement = Announcement::create($request->all());
        return response()->json(['success' => true, 'message' => 'Pengumuman dibuat']);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update($request->all());
        return response()->json(['success' => true, 'message' => 'Pengumuman diperbarui']);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['success' => true, 'message' => 'Pengumuman dihapus']);
    }
}