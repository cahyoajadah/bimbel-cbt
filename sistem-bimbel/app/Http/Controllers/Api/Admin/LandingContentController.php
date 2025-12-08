<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LandingContentController extends Controller
{
    /**
     * Display a listing of the resource.
     * Filter by 'section' query parameter is recommended.
     */
    public function index(Request $request)
    {
        $query = LandingContent::query();

        // Filter berdasarkan section jika ada (blog, gallery, program, dll)
        if ($request->has('section')) {
            $query->where('section', $request->query('section'));
        }

        // Urutkan berdasarkan order atau tanggal dibuat
        $contents = $query->orderBy('order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $contents
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'section'   => 'required|in:program,testimony,feature,faq,blog,gallery',
            'title'     => 'required|string|max:255',
            'content'   => 'nullable|string',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
            'order'     => 'integer|min:0',
            'is_active' => 'boolean'
        ]);

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            // Simpan di storage/app/public/landing/{section}
            $path = $file->storeAs(
                'landing/' . $validated['section'],
                Str::random(20) . '.' . $file->getClientOriginalExtension(),
                'public'
            );
            $validated['image'] = $path;
        }

        // Set default order jika tidak diisi
        if (!isset($validated['order'])) {
            $validated['order'] = 0;
        }

        $content = LandingContent::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Content created successfully',
            'data'    => $content
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $content = LandingContent::find($id);

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $content
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $content = LandingContent::find($id);

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found'
            ], 404);
        }

        $validated = $request->validate([
            'title'     => 'sometimes|required|string|max:255',
            'content'   => 'nullable|string',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'order'     => 'integer|min:0',
            'is_active' => 'boolean',
            'section'   => 'sometimes|in:program,testimony,feature,faq,blog,gallery' // Opsional jika ingin pindah section
        ]);

        // Handle Image Update
        if ($request->hasFile('image')) {
            // Hapus gambar lama jika ada
            if ($content->image && Storage::disk('public')->exists($content->image)) {
                Storage::disk('public')->delete($content->image);
            }

            $file = $request->file('image');
            $section = $validated['section'] ?? $content->section; // Gunakan section baru atau lama
            
            $path = $file->storeAs(
                'landing/' . $section,
                Str::random(20) . '.' . $file->getClientOriginalExtension(),
                'public'
            );
            $validated['image'] = $path;
        }

        $content->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Content updated successfully',
            'data'    => $content
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $content = LandingContent::find($id);

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found'
            ], 404);
        }

        // Hapus file gambar dari storage jika ada
        if ($content->image && Storage::disk('public')->exists($content->image)) {
            Storage::disk('public')->delete($content->image);
        }

        $content->delete();

        return response()->json([
            'success' => true,
            'message' => 'Content deleted successfully'
        ]);
    }
}