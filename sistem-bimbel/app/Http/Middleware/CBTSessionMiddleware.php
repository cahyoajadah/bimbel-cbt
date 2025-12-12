<?php
// ============================================
// app/Http/Middleware/CBTSessionMiddleware.php
// ============================================
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\CbtSession;

class CBTSessionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Cek Keberadaan Token
        $sessionToken = $request->header('X-CBT-Session-Token');

        if (!$sessionToken) {
            return response()->json([
                'success' => false,
                'message' => 'Session token CBT tidak ditemukan.'
            ], 401);
        }

        // 2. Ambil Sesi berdasarkan Token & Status Ongoing
        // Kita juga meload 'questionPackage' untuk mengecek durasi
        $session = CbtSession::where('session_token', $sessionToken)
            ->where('status', 'ongoing')
            ->with('questionPackage') 
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session CBT tidak valid atau sudah berakhir.'
            ], 401);
        }

        // 3. Validasi Kepemilikan (Security)
        // Pastikan user yang login adalah pemilik sesi ini
        $userStudentId = $request->user()->student->id ?? null;
        if ($session->student_id !== $userStudentId) {
            return response()->json([
                'success' => false,
                'message' => 'Session CBT bukan milik Anda.'
            ], 403);
        }

        // 4. VALIDASI WAKTU SERVER (Logic Baru)
        // Menghitung batas waktu selesai berdasarkan start_time + durasi paket
        if ($session->questionPackage) {
            $startTime = $session->start_time;
            $durationMinutes = $session->questionPackage->duration_minutes;
            
            // Tambahkan buffer/toleransi waktu (misal 30 detik) untuk latency internet
            $maxEndTime = $startTime->copy()->addMinutes($durationMinutes)->addSeconds(30);

            if (now()->greaterThan($maxEndTime)) {
                // Jika waktu server sudah lewat, paksa tutup sesi
                $session->update([
                    'status' => 'completed', 
                    'end_time' => now()
                ]);

                // Return status khusus 408 (Request Timeout) agar frontend bisa redirect
                return response()->json([
                    'success' => false,
                    'message' => 'Waktu ujian telah habis.',
                    'code' => 'SESSION_TIMEOUT' 
                ], 408);
            }
        }

        // 5. Cek Konflik Sesi Lain (Optional tapi bagus untuk integritas)
        // Memastikan tidak ada sesi 'ongoing' lain selain yang sedang diakses saat ini
        $otherOngoingSession = CbtSession::where('student_id', $session->student_id)
            ->where('id', '!=', $session->id)
            ->where('status', 'ongoing')
            ->exists();

        if ($otherOngoingSession) {
            // Opsional: Anda bisa memilih untuk mematikan sesi lain di sini atau membiarkan error
            return response()->json([
                'success' => false,
                'message' => 'Terdeteksi sesi aktif lain. Harap selesaikan sesi tersebut dahulu.'
            ], 409);
        }

        // 6. Merge sesi ke request agar bisa dipakai di Controller tanpa query ulang
        $request->merge(['cbt_session' => $session]);

        return $next($request);
    }
}