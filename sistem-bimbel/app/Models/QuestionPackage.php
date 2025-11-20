<?php
// ============================================
// app/Models/QuestionPackage.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionPackage extends Model
{
    protected $fillable = [
        'name', 'description', 'program_id', 'total_questions',
        'duration_minutes', 'passing_score', 'is_active', 'created_by'
    ];

    protected $casts = [
        'passing_score' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order_number');
    }

    public function cbtSessions(): HasMany
    {
        return $this->hasMany(CbtSession::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(StudentTryoutResult::class);
    }
}