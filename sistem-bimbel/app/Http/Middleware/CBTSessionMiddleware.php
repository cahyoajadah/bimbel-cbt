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
        $userStudentId = $request->user()->student->id ?? null;
        if ($session->student_id !== $userStudentId) {
            return response()->json([
                'success' => false,
                'message' => 'Session CBT bukan milik Anda.'
            ], 403);
        }

        // 4. VALIDASI WAKTU SERVER (Logic Baru & Lebih Aman)
        if ($session->questionPackage) {
            // [FIX] Pastikan start_time diparse sebagai Carbon untuk menghindari error format string
            $startTime = \Carbon\Carbon::parse($session->start_time);
            $durationMinutes = (int) $session->questionPackage->duration_minutes;
            
            // Tambahkan buffer 1 menit untuk toleransi latency jaringan
            $maxEndTime = $startTime->copy()->addMinutes($durationMinutes)->addSeconds(60);

            if (now()->greaterThan($maxEndTime)) {
                $session->update([
                    'status' => 'completed', 
                    'end_time' => now()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Waktu ujian telah habis.',
                    'code' => 'SESSION_TIMEOUT' 
                ], 408);
            }
        }

        // 5. Cek Konflik Sesi Lain
        $otherOngoingSession = CbtSession::where('student_id', $session->student_id)
            ->where('id', '!=', $session->id)
            ->where('status', 'ongoing')
            ->exists();

        if ($otherOngoingSession) {
            return response()->json([
                'success' => false,
                'message' => 'Terdeteksi sesi aktif lain. Harap selesaikan sesi tersebut dahulu.'
            ], 409);
        }

        // 6. Merge sesi ke request
        $request->merge(['cbt_session' => $session]);

        return $next($request);
    }
}