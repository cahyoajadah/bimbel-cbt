<?php
// ============================================
// app/Models/Feedback.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback extends Model
{
    use HasFactory;
    protected $table = 'feedbacks';
    
    protected $fillable = [
        'student_id', 'admin_id', 'month', 'content'
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}