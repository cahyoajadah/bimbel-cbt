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

    // [BARU] Ambil data Galeri
    public function gallery()
    {
        $gallery = LandingContent::where('section', 'gallery')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $gallery
        ]);
    }

    // [BARU] Ambil list Blog
    public function blog()
    {
        $blogs = LandingContent::where('section', 'blog')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc') // Blog biasanya urut tanggal terbaru
            ->get();

        return response()->json([
            'success' => true,
            'data' => $blogs
        ]);
    }

    // [BARU] Ambil detail 1 Blog
    public function showBlog($id)
    {
        $blog = LandingContent::where('id', $id)
            ->where('section', 'blog')
            ->where('is_active', true)
            ->first();

        if (!$blog) {
            return response()->json(['success' => false, 'message' => 'Blog not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $blog
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