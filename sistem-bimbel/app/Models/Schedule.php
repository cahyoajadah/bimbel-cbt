<?php
// ============================================
// app/Models/Schedule.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Schedule extends Model
{
    protected $fillable = [
        'title', 'description', 'type', 'class_type',
        'program_id', 'teacher_id', 'package_id',
        'start_time', 'end_time', 'zoom_link', 'location',
        'max_participants', 'is_active'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'schedule_participants')
            ->withPivot('is_attended', 'attended_at')
            ->withTimestamps();
    }
}
