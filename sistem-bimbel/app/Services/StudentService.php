<?php
// ============================================
// app/Services/StudentService.php
// ============================================
namespace App\Services;

use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /**
     * Create new student with user account
     */
    public function createStudent(array $userData, array $studentData)
    {
        DB::beginTransaction();
        try {
            $studentRole = Role::where('name', 'siswa')->first();

            $user = User::create([
                'role_id' => $studentRole->id,
                'name' => $userData['name'],
                'email' => $userData['email'],
                'phone' => $userData['phone'] ?? null,
                'password' => Hash::make($userData['password']),
                'is_active' => true,
            ]);

            $studentNumber = 'STD-' . date('Y') . '-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
            
            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $studentNumber,
                ...$studentData
            ]);

            DB::commit();

            return $student;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get student progress statistics
     */
    public function getStudentProgress(Student $student)
    {
        return [
            'total_materials' => $student->materials()->count(),
            'completed_materials' => $student->materials()
                ->wherePivot('is_completed', true)
                ->count(),
            'total_tryouts' => $student->tryoutResults()->count(),
            'average_score' => $student->tryoutResults()->avg('total_score'),
            'last_tryout_score' => $student->last_tryout_score,
            'total_attendance' => $student->total_attendance,
        ];
    }
}
