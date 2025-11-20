<?php
// ============================================
// app/Services/PackageService.php
// ============================================
namespace App\Services;

use App\Models\Package;
use Illuminate\Support\Facades\DB;

class PackageService
{
    /**
     * Assign package to multiple students
     */
    public function assignToStudents(Package $package, array $studentIds, $startDate, $endDate = null)
    {
        $syncData = [];
        foreach ($studentIds as $studentId) {
            $syncData[$studentId] = [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $package->students()->syncWithoutDetaching($syncData);

        return $package;
    }

    /**
     * Get package statistics
     */
    public function getPackageStats(Package $package)
    {
        return [
            'total_students' => $package->students()->count(),
            'active_students' => $package->students()
                ->wherePivot('is_active', true)
                ->count(),
            'total_schedules' => $package->schedules()->count(),
        ];
    }
}
