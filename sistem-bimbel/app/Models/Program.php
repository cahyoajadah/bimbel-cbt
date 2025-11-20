<?php
// ============================================
// app/Models/Program.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $fillable = ['name', 'code', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function studentPrograms(): HasMany
    {
        return $this->hasMany(StudentProgram::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(Package::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function questionPackages(): HasMany
    {
        return $this->hasMany(QuestionPackage::class);
    }
}
