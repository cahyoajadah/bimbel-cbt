<?php
// ============================================
// app/Http/Controllers/Api/Public/LandingController.php
// ============================================
namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\LandingContent;

class LandingController extends Controller
{
    public function programs()
    {
        $programs = LandingContent::where('section', 'program')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $programs
        ]);
    }

    public function testimonies()
    {
        $testimonies = LandingContent::where('section', 'testimony')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $testimonies
        ]);
    }

    public function features()
    {
        $features = LandingContent::where('section', 'feature')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $features
        ]);
    }

    public function faq()
    {
        $faq = LandingContent::where('section', 'faq')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $faq
        ]);
    }
}