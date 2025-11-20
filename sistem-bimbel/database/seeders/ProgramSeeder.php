<?php
// ============================================
// database/seeders/ProgramSeeder.php
// ============================================
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Program;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            [
                'name' => 'UTBK',
                'code' => 'UTBK',
                'description' => 'Program persiapan Ujian Tulis Berbasis Komputer',
                'is_active' => true
            ],
            [
                'name' => 'SKD',
                'code' => 'SKD',
                'description' => 'Program persiapan Seleksi Kompetensi Dasar CPNS',
                'is_active' => true
            ],
            [
                'name' => 'CPNS',
                'code' => 'CPNS',
                'description' => 'Program persiapan CPNS lengkap',
                'is_active' => true
            ],
        ];

        foreach ($programs as $program) {
            Program::create($program);
        }
    }
}