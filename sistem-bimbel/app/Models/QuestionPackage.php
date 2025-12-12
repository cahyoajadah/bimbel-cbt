<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'name',
        'description',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    // [PENTING] Tambahkan method ini agar error 500 hilang
    public function categories(): HasMany
    {
        return $this->hasMany(QuestionCategory::class);
    }

    // Helper function
    public function isAvailable()
    {
        $now = now();
        if (!$this->start_date && !$this->end_date) return true;
        $start = $this->start_date ? $this->start_date : $now->copy()->subDay();
        $end = $this->end_date ? $this->end_date : $now->copy()->addYears(100);
        return $now->between($start, $end);
    }
}