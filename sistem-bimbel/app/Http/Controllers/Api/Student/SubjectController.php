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
     * Get all subjects (card view)
     */
    public function index(Request $request)
    {
        $query = Subject::with('materials')
                    ->where('is_active', true);
        
        return response()->json([
        'success' => true,
        'data' => $query->get()
        ]);
    }

    /**
     * Get subject detail
     */
    public function show(Request $request, $id)
    {
        $student = $request->user()->student;
        
        $subject = Subject::with(['program', 'materials' => function($query) {
            $query->where('is_active', true)->orderBy('order');
        }])->findOrFail($id);

        // Add student progress info
        $materials = $subject->materials->map(function($material) use ($student) {
            $pivot = $student->materials()
                ->where('material_id', $material->id)
                ->first();

            return [
                'id' => $material->id,
                'title' => $material->title,
                'description' => $material->description,
                'type' => $material->type,
                'duration_minutes' => $material->duration_minutes,
                'order' => $material->order,
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
     * Get materials for a subject
     */
    public function getMaterials(Request $request, $id)
    {
        $student = $request->user()->student;
        
        $subject = Subject::findOrFail($id);
        $materials = $subject->materials()
            ->where('is_active', true)
            ->orderBy('order')
            ->get()
            ->map(function($material) use ($student) {
                $pivot = $student->materials()
                    ->where('material_id', $material->id)
                    ->first();

                $materialData = [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'type' => $material->type,
                    'order' => $material->order,
                    'duration_minutes' => $material->duration_minutes,
                    'is_completed' => $pivot ? $pivot->pivot->is_completed : false,
                    'progress_percentage' => $pivot ? $pivot->pivot->progress_percentage : 0,
                ];

                // Add content based on type
                if ($material->type === 'video') {
                    $materialData['youtube_url'] = $material->content;
                } else if ($material->type === 'pdf') {
                    $materialData['pdf_url'] = url('storage/' . $material->content);
                }

                return $materialData;
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