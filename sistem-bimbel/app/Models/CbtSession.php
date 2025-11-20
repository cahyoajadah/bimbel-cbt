<?php
// ============================================
// app/Models/CbtSession.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CbtSession extends Model
{
    protected $fillable = [
        'student_id', 'question_package_id', 'session_token',
        'start_time', 'end_time', 'status', 'is_fullscreen',
        'warning_count'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_fullscreen' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function questionPackage(): BelongsTo
    {
        return $this->belongsTo(QuestionPackage::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(StudentAnswer::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(StudentTryoutResult::class);
    }
}
