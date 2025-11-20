<?php
// ============================================
// app/Models/Material.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Material extends Model
{
    protected $fillable = [
        'subject_id', 'title', 'description', 'type',
        'content', 'order', 'duration_minutes', 'is_active'
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_materials')
            ->withPivot('is_completed', 'completed_at', 'progress_percentage')
            ->withTimestamps();
    }
}