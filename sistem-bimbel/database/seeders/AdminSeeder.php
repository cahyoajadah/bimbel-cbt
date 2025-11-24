<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Program;
use App\Models\Student; // Pastikan import Model Student
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // 1. SETUP ROLES
        // Kita gunakan firstWhere agar query lebih efisien
        $adminRole = Role::where('name', 'admin_manajemen')->first();
        $makerRole = Role::where('name', 'pembuat_soal')->first();
        $studentRole = Role::where('name', 'siswa')->first();

        // 2. SETUP PROGRAMS
        // Menggunakan logic: Cari berdasarkan nama, jika tidak ada cari ID, jika null biarkan null
        $progUtbk = Program::where('name', 'UTBK')->first() ?? Program::find(1);
        $progSkd  = Program::where('name', 'SKD')->first() ?? Program::find(2);
        $progCpns = Program::where('name', 'CPNS')->first() ?? Program::find(3);

        // 3. BUAT ADMIN MANAJEMEN (Gunakan firstOrCreate agar tidak duplikat email)
        if ($adminRole) {
            User::firstOrCreate(
                ['email' => 'admin@bimbel.com'], // Cek berdasarkan email
                [
                    'role_id' => $adminRole->id,
                    'name' => 'Admin Manajemen',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );
        }

        // 4. BUAT ADMIN PEMBUAT SOAL
        if ($makerRole) {
            User::firstOrCreate(
                ['email' => 'pembuat.soal@bimbel.com'],
                [
                    'role_id' => $makerRole->id,
                    'name' => 'Admin Pembuat Soal',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );
        }

        // 5. BUAT SISWA DEMO
        if ($studentRole) {
            // --- SISWA 1: UTBK ---
            $s1 = User::firstOrCreate(
                ['email' => 'siswautbk@bimbel.com'],
                [
                    'role_id' => $studentRole->id,
                    'name' => 'Siswa UTBK Demo',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );

            // Buat Profile Student jika belum ada
            // Menggunakan firstOrCreate pada relasi student
            $p1 = Student::firstOrCreate(
                ['user_id' => $s1->id],
                [
                    'student_number' => 'STD-' . date('Y') . '-0001',
                    'birth_date' => '2005-01-01',
                    'address' => 'Jakarta Selatan',
                    'school' => 'SMA Negeri 1 Jakarta',
                    'parent_name' => 'Ayah UTBK',
                    'parent_phone' => '081200000001',
                ]
            );

            // Attach Program (Cek dulu agar tidak error duplicate entry di pivot)
            if ($progUtbk && !$p1->programs()->where('program_id', $progUtbk->id)->exists()) {
                $p1->programs()->attach($progUtbk->id, ['start_date' => now(), 'is_active' => true]);
            }


            // --- SISWA 2: SKD ---
            $s2 = User::firstOrCreate(
                ['email' => 'siswaskd@bimbel.com'],
                [
                    'role_id' => $studentRole->id,
                    'name' => 'Siswa SKD Demo',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );

            $p2 = Student::firstOrCreate(
                ['user_id' => $s2->id],
                [
                    'student_number' => 'STD-' . date('Y') . '-0002',
                    'birth_date' => '2004-05-20',
                    'address' => 'Jakarta Timur',
                    'school' => 'SMA Negeri 2 Jakarta',
                    'parent_name' => 'Ayah SKD',
                    'parent_phone' => '081200000002',
                ]
            );

            if ($progSkd && !$p2->programs()->where('program_id', $progSkd->id)->exists()) {
                $p2->programs()->attach($progSkd->id, ['start_date' => now(), 'is_active' => true]);
            }


            // --- SISWA 3: CPNS ---
            $s3 = User::firstOrCreate(
                ['email' => 'siswacpns@bimbel.com'],
                [
                    'role_id' => $studentRole->id,
                    'name' => 'Siswa CPNS Demo',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ]
            );

            $p3 = Student::firstOrCreate(
                ['user_id' => $s3->id],
                [
                    'student_number' => 'STD-' . date('Y') . '-0003',
                    'birth_date' => '2000-12-12',
                    'address' => 'Jakarta Pusat',
                    'school' => 'Universitas Indonesia',
                    'parent_name' => 'Ibu CPNS',
                    'parent_phone' => '081200000003',
                ]
            );

            if ($progCpns && !$p3->programs()->where('program_id', $progCpns->id)->exists()) {
                $p3->programs()->attach($progCpns->id, ['start_date' => now(), 'is_active' => true]);
            }
        }
    }
}