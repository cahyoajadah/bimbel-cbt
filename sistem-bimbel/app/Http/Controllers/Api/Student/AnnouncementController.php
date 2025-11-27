<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user()->student;
        $programIds = $student->programs()->pluck('programs.id');

        $announcements = Announcement::where('is_active', true)
            ->where(function($q) use ($programIds) {
                $q->whereNull('program_id') // Untuk Semua
                  ->orWhereIn('program_id', $programIds); // Khusus Program Siswa
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function recent(Request $request)
    {
        $student = $request->user()->student;
        $programIds = $student->programs()->pluck('programs.id');

        $recent = Announcement::where('is_active', true)
            ->where(function($q) use ($programIds) {
                $q->whereNull('program_id')
                  ->orWhereIn('program_id', $programIds);
            })
            ->orderBy('created_at', 'desc')
            ->limit(5) // Tampilkan 5 terbaru di notif
            ->get();

        return response()->json(['success' => true, 'data' => $recent]);
    }
}