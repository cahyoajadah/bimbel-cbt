<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'title',
        'type',       // video, pdf, text
        'content',    // url atau file path
        'description',
        'order_number', // [PENTING] Gunakan order_number
        'is_active',
        // duration_minutes SUDAH DIHAPUS
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_materials')
            ->withPivot('is_completed', 'progress_percentage')
            ->withTimestamps();
    }
}