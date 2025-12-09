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
        'program_id',
        'name',
        'description',
        'duration_minutes',
        'passing_score',
        'max_attempts',
        'start_date',
        'end_date',   
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date', // Auto convert ke Carbon Date
        'end_date' => 'date',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    // Helper untuk cek apakah paket sedang aktif berdasarkan tanggal
    public function isAvailable()
    {
        $now = now()->startOfDay();
        
        // Jika tanggal tidak diisi, dianggap selalu aktif
        if (!$this->start_date && !$this->end_date) return true;

        $start = $this->start_date ? $this->start_date->startOfDay() : $now;
        $end = $this->end_date ? $this->end_date->endOfDay() : $now->addYears(100);

        return $now->between($start, $end);
    }
}