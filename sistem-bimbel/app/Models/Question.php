<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_package_id',
        'question_category_id', // [BARU]
        'type',
        'question_text',
        'question_image',
        'point',
        'order_number',
        'explanation'
    ];

    public function package()
    {
        return $this->belongsTo(QuestionPackage::class, 'question_package_id');
    }

    // [BARU] Relasi ke Kategori
    public function category()
    {
        return $this->belongsTo(QuestionCategory::class, 'question_category_id');
    }

    public function answerOptions()
    {
        return $this->hasMany(AnswerOption::class);
    }
    
    public function reports()
    {
        return $this->hasMany(QuestionReport::class);
    }
}