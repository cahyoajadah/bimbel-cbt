<?php
// ============================================
// app/Services/MaterialService.php
// ============================================
namespace App\Services;

use App\Models\Material;
use Illuminate\Support\Facades\Storage;

class MaterialService
{
    /**
     * Create material with file upload handling
     */
    public function createMaterial(array $data, $file = null)
    {
        if ($data['type'] === 'pdf' && $file) {
            $data['content'] = $file->store('materials/pdf', 'public');
        }

        return Material::create($data);
    }

    /**
     * Update material with file handling
     */
    public function updateMaterial(Material $material, array $data, $file = null)
    {
        if ($file) {
            // Delete old file
            if ($material->type === 'pdf' && $material->content) {
                Storage::disk('public')->delete($material->content);
            }
            
            $data['content'] = $file->store('materials/pdf', 'public');
        }

        $material->update($data);

        return $material;
    }

    /**
     * Delete material with file cleanup
     */
    public function deleteMaterial(Material $material)
    {
        if ($material->type === 'pdf' && $material->content) {
            Storage::disk('public')->delete($material->content);
        }

        $material->delete();
    }

    /**
     * Assign material to students
     */
    public function assignToStudents(Material $material, array $studentIds)
    {
        $syncData = [];
        foreach ($studentIds as $studentId) {
            $syncData[$studentId] = [
                'is_completed' => false,
                'progress_percentage' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $material->students()->syncWithoutDetaching($syncData);

        return $material;
    }
}
