<?php
// ============================================
// app/Models/Question.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'question_package_id', 'order_number', 'question_text',
        'question_image', 'duration_seconds', 'point',
        'explanation', 'explanation_image'
    ];

    protected $casts = ['point' => 'decimal:2'];

    public function questionPackage(): BelongsTo
    {
        return $this->belongsTo(QuestionPackage::class);
    }

    public function answerOptions(): HasMany
    {
        return $this->hasMany(AnswerOption::class);
    }

    public function correctOption(): HasMany
    {
        return $this->hasMany(AnswerOption::class)->where('is_correct', true);
    }

    public function studentAnswers(): HasMany
    {
        return $this->hasMany(StudentAnswer::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(QuestionReport::class);
    }
}