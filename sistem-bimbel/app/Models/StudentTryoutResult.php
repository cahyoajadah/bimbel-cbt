<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentTryoutResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'cbt_session_id',
        'student_id',
        'question_package_id',
        'total_questions',
        'answered_questions',
        'correct_answers',
        'wrong_answers',
        'total_score',
        'percentage',
        'is_passed',
        'duration_seconds',
        'category_scores', // [BARU]
    ];

    protected $casts = [
        'is_passed' => 'boolean',
        'category_scores' => 'array', // [PENTING] Auto convert JSON <-> Array
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function questionPackage()
    {
        return $this->belongsTo(QuestionPackage::class);
    }

    public function cbtSession()
    {
        return $this->belongsTo(CbtSession::class);
    }
}