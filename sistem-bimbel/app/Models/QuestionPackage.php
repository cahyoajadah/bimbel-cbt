<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'name',
        'description',
        'duration_minutes',
        'passing_score', // Global Passing Score
        'max_attempts',
        'start_date',
        'end_date',   
        'is_active',
        'execution_mode', // 'flexible' atau 'live'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    // [BARU] Relasi ke Kategori Dinamis
    public function categories()
    {
        return $this->hasMany(QuestionCategory::class);
    }

    public function isAvailable()
    {
        $now = now()->startOfDay();
        if (!$this->start_date && !$this->end_date) return true;
        $start = $this->start_date ? $this->start_date->startOfDay() : $now;
        $end = $this->end_date ? $this->end_date->endOfDay() : $now->addYears(100);
        return $now->between($start, $end);
    }

    public function tryoutResults()
    {
        return $this->hasMany(StudentTryoutResult::class, 'question_package_id');
    }
}