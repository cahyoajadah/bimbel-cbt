<?php
// ============================================
// app/Models/AnswerOption.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnswerOption extends Model
{
    protected $fillable = [
        'question_id',
        'option_label', // A, B, C, dll
        'option_text',
        'option_image',
        'is_correct',
        'weight',       // <--- Tambahkan kolom ini
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'weight' => 'integer', // <--- Casting ke integer
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}