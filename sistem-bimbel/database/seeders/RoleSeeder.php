<?php
// ============================================
// database/seeders/RoleSeeder.php
// ============================================
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin_manajemen',
                'display_name' => 'Admin Manajemen',
                'description' => 'Administrator yang mengelola sistem bimbel'
            ],
            [
                'name' => 'pembuat_soal',
                'display_name' => 'Admin Pembuat Soal',
                'description' => 'Administrator yang membuat dan mengelola soal CBT'
            ],
            [
                'name' => 'siswa',
                'display_name' => 'Siswa',
                'description' => 'Siswa yang mengikuti bimbingan belajar'
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}