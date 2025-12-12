<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionCategory extends Model
{
    use HasFactory;

    protected $fillable = ['question_package_id', 'name', 'passing_grade'];

    public function questionPackage(): BelongsTo
    {
        return $this->belongsTo(QuestionPackage::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}