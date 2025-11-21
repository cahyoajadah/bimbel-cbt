<?php
// ============================================
// database/seeders/AdminSeeder.php
// ============================================
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Program; // <--- Tambahkan Import ini
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Admin Manajemen
        $adminRole = Role::where('name', 'admin_manajemen')->first();
        User::create([
            'role_id' => $adminRole->id,
            'name' => 'Admin Manajemen',
            'email' => 'admin@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // 2. Buat Admin Pembuat Soal
        $questionMakerRole = Role::where('name', 'pembuat_soal')->first();
        User::create([
            'role_id' => $questionMakerRole->id,
            'name' => 'Admin Pembuat Soal',
            'email' => 'pembuat.soal@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // 3. Buat Siswa Demo (DENGAN PROGRAM)
        $studentRole = Role::where('name', 'siswa')->first();
        
        // Ambil Program Pertama sebagai default (Pastikan ProgramSeeder dijalankan duluan)
        $program = Program::first(); 

        $studentUser = User::create([
            'role_id' => $studentRole->id,
            'name' => 'Siswa Demo',
            'email' => 'siswa@bimbel.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Create student profile
        $studentProfile = $studentUser->student()->create([
            'student_number' => 'STD-' . date('Y') . '-0001',
            'birth_date' => '2005-01-15',
            'address' => 'Jakarta',
            'school' => 'SMA Negeri 1',
            'parent_name' => 'Bapak Demo',
            'parent_phone' => '081234567890',
        ]);

        // [PENTING] Hubungkan Siswa ke Program via Tabel Pivot
        if ($program) {
            $studentProfile->programs()->attach($program->id);
        }
    }
}