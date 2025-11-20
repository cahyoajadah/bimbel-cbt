<?php
// ============================================
// app/Models/LandingContent.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingContent extends Model
{
    protected $fillable = [
        'section', 'title', 'content', 'image', 'order', 'is_active'
    ];

    protected $casts = ['is_active' => 'boolean'];
}