<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// [PENTING] Nama class harus QuestionPackage, bukan Question
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

    // Relasi ke Program
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    // Relasi ke Soal
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    // Relasi ke Kategori
    public function categories(): HasMany
    {
        return $this->hasMany(QuestionCategory::class);
    }
}