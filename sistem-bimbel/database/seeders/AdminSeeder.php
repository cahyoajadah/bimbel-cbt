<?php
// ============================================
// database/seeders/AdminSeeder.php
// ============================================
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Manajemen
        $adminRole = Role::where('name', 'admin_manajemen')->first();
        User::create([
            'role_id' => $adminRole->id,
            'name' => 'Admin Manajemen',
            'email' => 'admin@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Admin Pembuat Soal
        $questionMakerRole = Role::where('name', 'pembuat_soal')->first();
        User::create([
            'role_id' => $questionMakerRole->id,
            'name' => 'Admin Pembuat Soal',
            'email' => 'pembuat.soal@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Contoh Siswa
        $studentRole = Role::where('name', 'siswa')->first();
        $studentUser = User::create([
            'role_id' => $studentRole->id,
            'name' => 'Siswa Demo',
            'email' => 'siswa@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Create student profile
        $studentUser->student()->create([
            'student_number' => 'STD-' . date('Y') . '-0001',
            'birth_date' => '2005-01-15',
            'address' => 'Jakarta',
            'school' => 'SMA Negeri 1',
            'parent_name' => 'Bapak Demo',
            'parent_phone' => '081234567890',
        ]);
    }
}