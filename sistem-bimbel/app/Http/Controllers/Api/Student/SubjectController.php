<?php
// ============================================
// app/Http/Controllers/Api/Student/SubjectController.php
// ============================================

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Material;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Get all subjects (Filtered by Student Program)
     */
    public function index(Request $request)
    {
        // 1. Ambil data siswa
        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        // 2. Ambil ID Program yang diambil siswa
        $studentProgramIds = $student->programs()->pluck('programs.id');

        // 3. Query Subject dengan Filter Program
        $query = Subject::with('program') // Load nama program untuk UI
                    ->withCount('materials') // Opsional: hitung jumlah materi
                    ->where('is_active', true)
                    ->whereIn('program_id', $studentProgramIds); // <--- FILTER UTAMA
        
        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    /**
     * Get subject detail (Secured)
     */
    public function show(Request $request, $id)
    {
        $student = $request->user()->student;
        $studentProgramIds = $student->programs()->pluck('programs.id');
        
        // Cari subject, tapi pastikan program_id nya cocok dengan siswa
        $subject = Subject::with(['program', 'materials' => function($query) {
                $query->where('is_active', true)->orderBy('order_number');
            }])
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds) // <--- SECURITY CHECK
            ->firstOrFail(); // Gunakan firstOrFail agar return 404 jika akses ditolak/tidak ada

        // Add student progress info
        $materials = $subject->materials->map(function($material) use ($student) {
            $pivot = $student->materials()
                ->where('materials.id', $material->id)
                ->first();

            return [
                'id' => $material->id,
                'title' => $material->title,
                'description' => $material->description,
                'type' => $material->type,
                // [PERBAIKAN 1] Tambahkan baris ini:
                'content' => $material->content,       // <--- PENTING: Agar PDF bisa dibuka
                'can_download' => $material->can_download, // <--- PENTING: Untuk izin download
                // 'duration_minutes' => $material->duration_minutes,
                'order' => $material->order_number,
                'is_completed' => $pivot ? $pivot->pivot->is_completed : false,
                'progress_percentage' => $pivot ? $pivot->pivot->progress_percentage : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'subject' => $subject,
                'materials' => $materials,
            ]
        ]);
    }

    /**
     * Get materials for a subject (Secured)
     */
   // app/Http/Controllers/Api/Student/SubjectController.php

    public function getMaterials(Request $request, $id)
    {
        $user = $request->user();
        
        // Cek apakah user memiliki data student
        if (!$user->student) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 403);
        }
        
        $student = $user->student;
        $studentProgramIds = $student->programs()->pluck('programs.id');
        
        // Cek akses subject sesuai program siswa
        $subject = Subject::where('id', $id)
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds)
            ->firstOrFail();

        $materials = $subject->materials()
            ->where('is_active', true)
            ->orderBy('order_number')
            ->get()
            ->map(function($material) use ($student) {
                $pivot = $student->materials()
                    ->where('materials.id', $material->id)
                    ->first();

                return [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'type' => $material->type,
                    
                    // [PENTING] Wajib ada agar Frontend bisa membaca file/video
                    'content' => $material->content,       
                    'can_download' => (int) $material->can_download, // Pastikan jadi angka 1/0
                    
                    'order' => $material->order_number,
                    'is_completed' => $pivot ? $pivot->pivot->is_completed : false,
                    'progress_percentage' => $pivot ? $pivot->pivot->progress_percentage : 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $materials
        ]);
    }

    /**
     * Mark material as complete
     */
    public function completeMaterial(Request $request, $id)
    {
        $student = $request->user()->student;
        $material = Material::findOrFail($id);

        // Validasi tambahan: pastikan materi ini milik subject yang boleh diakses siswa
        // (Opsional tapi disarankan untuk keamanan tingkat tinggi)
        
        $request->validate([
            'progress_percentage' => 'nullable|integer|min:0|max:100',
        ]);

        $progressPercentage = $request->get('progress_percentage', 100);
        $isCompleted = $progressPercentage >= 100;

        $student->materials()->syncWithoutDetaching([
            $material->id => [
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
                'progress_percentage' => $progressPercentage,
                'updated_at' => now(),
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Progress materi berhasil diperbarui'
        ]);
    }
}