<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionPackage extends Model
{
    use HasFactory;

    // [PENTING] Pastikan SEMUA nama kolom yang ingin diinput ada di sini
    protected $fillable = [
        'program_id',
        'name',
        'description',
        'duration_minutes',
        'passing_score',
        
        // Field Kategori (Yang baru ditambahkan)
        'passing_grade_twk',
        'passing_grade_tiu',
        'passing_grade_tkp',
        
        'max_attempts',
        'start_date',
        'end_date',   
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function isAvailable()
    {
        $now = now()->startOfDay();
        if (!$this->start_date && !$this->end_date) return true;
        $start = $this->start_date ? $this->start_date->startOfDay() : $now;
        $end = $this->end_date ? $this->end_date->endOfDay() : $now->addYears(100);
        return $now->between($start, $end);
    }
}