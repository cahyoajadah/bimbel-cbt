<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionCategory extends Model
{
    use HasFactory;

    protected $fillable = ['question_package_id', 'name', 'passing_grade'];

    public function package()
    {
        return $this->belongsTo(QuestionPackage::class, 'question_package_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}