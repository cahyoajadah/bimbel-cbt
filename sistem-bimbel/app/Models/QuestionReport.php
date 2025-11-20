<?php
// ============================================
// app/Models/QuestionReport.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionReport extends Model
{
    protected $fillable = [
        'question_id', 'student_id', 'report_content',
        'status', 'admin_response'
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}