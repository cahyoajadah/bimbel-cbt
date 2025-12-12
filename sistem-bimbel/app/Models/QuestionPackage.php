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
        'start_date', // [BARU] Wajib ada
        'end_date',   // [BARU] Wajib ada
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime', // Casting ke format tanggal
        'end_date' => 'datetime',   // Casting ke format tanggal
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(QuestionCategory::class);
    }
}