<?php
// ============================================
// app/Models/QuestionPackage.php
// ============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'created_by',
        'name',
        'description',
        'class_level',
        'program_type',
        'is_active',
        // [BARU] Tambahkan field waktu
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        // [BARU] Auto-convert ke objek Carbon/DateTime
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}