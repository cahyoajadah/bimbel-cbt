<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name', 
        'description', 
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // [WAJIB ADA] Relasi ke Siswa
    public function students()
    {
        // Relasi Many-to-Many dengan tabel pivot student_programs
        return $this->belongsToMany(Student::class, 'student_programs');
    }
    // Relasi ke Mata Pelajaran
    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }
    // Relasi ke Paket Soal
    public function questionPackages()
    {
        return $this->hasMany(QuestionPackage::class);
    }
}