<?php
// ============================================
// app/Models/Subject.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = [
        'program_id', // <--- TAMBAHKAN INI
        'name',
        'code',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean', // Pastikan ini ada agar true/false terbaca benar
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }
}