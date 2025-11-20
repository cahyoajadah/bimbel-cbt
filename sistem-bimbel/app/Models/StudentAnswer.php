<?php
// ============================================
// app/Models/StudentAnswer.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAnswer extends Model
{
    protected $fillable = [
        'cbt_session_id', 'question_id', 'answer_option_id',
        'is_correct', 'point_earned', 'answered_at'
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'point_earned' => 'decimal:2',
        'answered_at' => 'datetime',
    ];

    public function cbtSession(): BelongsTo
    {
        return $this->belongsTo(CbtSession::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function answerOption(): BelongsTo
    {
        return $this->belongsTo(AnswerOption::class);
    }
}