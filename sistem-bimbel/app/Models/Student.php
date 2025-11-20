<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    protected $fillable = [
        'user_id', 'student_number', 'birth_date', 'address',
        'school', 'parent_name', 'parent_phone', 
        'total_attendance', 'last_tryout_score'
    ];

    protected $casts = [
        'birth_date' => 'date',
        'last_tryout_score' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(StudentProgram::class);
    }

    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(Package::class, 'student_packages')
            ->withPivot('start_date', 'end_date', 'is_active')
            ->withTimestamps();
    }

    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(Material::class, 'student_materials')
            ->withPivot('is_completed', 'completed_at', 'progress_percentage')
            ->withTimestamps();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function tryoutResults(): HasMany
    {
        return $this->hasMany(StudentTryoutResult::class);
    }

    public function cbtSessions(): HasMany
    {
        return $this->hasMany(CbtSession::class);
    }

    public function questionReports(): HasMany
    {
        return $this->hasMany(QuestionReport::class);
    }
}