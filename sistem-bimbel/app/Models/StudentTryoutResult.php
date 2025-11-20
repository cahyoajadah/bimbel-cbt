<?php
// ============================================
// app/Models/StudentTryoutResult.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentTryoutResult extends Model
{
    protected $fillable = [
        'cbt_session_id', 'student_id', 'question_package_id',
        'total_questions', 'answered_questions', 'correct_answers',
        'wrong_answers', 'total_score', 'percentage', 'is_passed',
        'duration_seconds'
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_passed' => 'boolean',
    ];

    public function cbtSession(): BelongsTo
    {
        return $this->belongsTo(CbtSession::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function questionPackage(): BelongsTo
    {
        return $this->belongsTo(QuestionPackage::class);
    }
}