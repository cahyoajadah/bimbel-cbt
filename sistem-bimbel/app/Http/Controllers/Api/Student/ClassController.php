<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    /**
     * Daftar Kelas Live (Zoom) untuk Siswa
     * Menampilkan: SEMUA jadwal (Kelas & Tryout) yang tipe kelasnya 'zoom'
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        $studentProgramIds = $student->programs()->pluck('programs.id');

        // QUERY UTAMA
        $query = Schedule::with(['program', 'teacher.user', 'subject'])
            ->where('is_active', true)
            
            // FILTER 1: Sesuai Program Siswa
            ->whereIn('program_id', $studentProgramIds)
            
            // [PERBAIKAN UTAMA]
            // Hapus "where('type', 'class')" yang memblokir tryout.
            // Ganti dengan "where('class_type', 'zoom')".
            ->where('class_type', 'zoom')
            
            // FILTER WAKTU (KETAT)
            // Hanya tampilkan jadwal yang BELUM lewat (masa depan)
            ->where('start_time', '>=', now());

        $classes = $query->orderBy('start_time', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    /**
     * Widget Dashboard: 5 Jadwal Zoom Terdekat
     */
    public function upcoming(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) return response()->json(['data' => []]);

        $studentProgramIds = $student->programs()->pluck('programs.id');

        $classes = Schedule::with(['program', 'teacher.user', 'subject'])
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds)
            
            // [PERBAIKAN] Filter Zoom saja (Kelas & Tryout masuk)
            ->where('class_type', 'zoom')
            
            // Filter Waktu Ketat
            ->where('start_time', '>=', now())
            
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    /**
     * Join Class (Mencatat Kehadiran)
     */
    public function join(Request $request, $id)
    {
        $student = $request->user()->student;
        
        // Cari jadwal, pastikan tipe zoom
        $schedule = Schedule::where('class_type', 'zoom')
            ->where('is_active', true)
            ->findOrFail($id);

        if (!$schedule->zoom_link) {
             return response()->json(['message' => 'Link Zoom tidak tersedia'], 400);
        }

        // Catat kehadiran
        $schedule->participants()->syncWithoutDetaching([
            $student->id => [
                'is_attended' => true,
                'attended_at' => now(),
            ]
        ]);

        return response()->json([
            'success' => true,
            'data' => ['zoom_link' => $schedule->zoom_link]
        ]);
    }

    /**
     * Jadwal Lengkap (Kalender) - Menampilkan SEMUA (Offline + Online)
     */
    public function schedules(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) return response()->json(['data' => []]);

        $studentProgramIds = $student->programs()->pluck('programs.id');

        $query = Schedule::with(['program', 'teacher.user', 'subject'])
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds);

        // Filter Tanggal Spesifik (dari Kalender Frontend)
        if ($request->has('date')) {
            $query->whereDate('start_time', $request->date);
        } 

        // Urutkan
        $schedules = $query->orderBy('start_time', 'asc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }
}