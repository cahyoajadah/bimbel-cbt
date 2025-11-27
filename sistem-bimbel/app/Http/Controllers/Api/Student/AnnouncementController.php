<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    // Helper untuk query dasar (filter program & aktif)
    private function baseQuery($student)
    {
        $programIds = $student->programs()->pluck('programs.id');

        return Announcement::where('is_active', true)
            ->where(function($q) use ($programIds) {
                $q->whereNull('program_id')
                  ->orWhereIn('program_id', $programIds);
            });
    }

    public function index(Request $request)
    {
        $student = $request->user()->student;
        
        $announcements = $this->baseQuery($student)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Cek status read untuk setiap pengumuman
        $announcements->getCollection()->transform(function ($item) use ($student) {
            $isRead = DB::table('announcement_reads')
                ->where('student_id', $student->id)
                ->where('announcement_id', $item->id)
                ->exists();
            $item->is_read = $isRead;
            return $item;
        });
            
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    // Untuk Notifikasi di Header (Hanya ambil yang BELUM DIBACA)
    public function recent(Request $request)
    {
        $student = $request->user()->student;

        // Ambil ID pengumuman yang sudah dibaca
        $readIds = DB::table('announcement_reads')
            ->where('student_id', $student->id)
            ->pluck('announcement_id');

        $unread = $this->baseQuery($student)
            ->whereNotIn('id', $readIds) // Filter yang belum dibaca
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json(['success' => true, 'data' => $unread]);
    }

    // [BARU] Tandai sudah dibaca
    public function markAsRead(Request $request, $id)
    {
        $student = $request->user()->student;
        
        // Gunakan insertOrIgnore atau cek exists dulu agar tidak duplikat
        $exists = DB::table('announcement_reads')
            ->where('student_id', $student->id)
            ->where('announcement_id', $id)
            ->exists();

        if (!$exists) {
            DB::table('announcement_reads')->insert([
                'student_id' => $student->id,
                'announcement_id' => $id,
                'read_at' => now()
            ]);
        }

        return response()->json(['success' => true]);
    }
}