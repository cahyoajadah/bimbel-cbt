<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\CbtSession;
use Carbon\Carbon;

class CheckCbtSession
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Ambil Token dari Header (Pastikan nama header konsisten)
        $token = $request->header('X-CBT-SESSION-TOKEN');

        // Jika tidak ada di header, cek query param (opsional, buat jaga-jaga)
        if (!$token) {
            $token = $request->query('session_token');
        }

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token sesi tidak ditemukan. Header kosong.'
            ], 401);
        }

        // 2. Cek Validitas Token di Database
        $session = CbtSession::where('session_token', $token)
            ->where('status', 'ongoing') // Wajib Ongoing
            ->with('questionPackage')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi tidak valid atau sudah selesai.'
            ], 401);
        }

        // 3. Cek Pemilik Sesi (User Login vs Pemilik Sesi)
        $user = $request->user();
        if (!$user || !$user->student || $session->student_id !== $user->student->id) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi ini bukan milik akun Anda.'
            ], 403);
        }

        // 4. Validasi Waktu (Cegah akses jika waktu habis)
        if ($session->questionPackage) {
            $now = now();
            
            // Logika Live
            if ($session->questionPackage->execution_mode === 'live') {
                if ($session->questionPackage->end_date && $now->gt($session->questionPackage->end_date)) {
                    $this->terminateSession($session);
                    return response()->json(['message' => 'Waktu ujian Live telah berakhir.', 'code' => 'TIMEOUT'], 408);
                }
            } 
            // Logika Fleksibel
            else {
                $start = Carbon::parse($session->start_time);
                $end = $start->copy()->addMinutes($session->questionPackage->duration_minutes)->addSeconds(30); // Buffer 30 detik
                
                if ($now->gt($end)) {
                    $this->terminateSession($session);
                    return response()->json(['message' => 'Durasi ujian telah habis.', 'code' => 'TIMEOUT'], 408);
                }
            }
        }

        // 5. Inject Data Sesi ke Request (Agar Controller tidak perlu query lagi)
        $request->merge(['cbt_session' => $session]);

        return $next($request);
    }

    private function terminateSession($session) {
        $session->update(['status' => 'completed', 'end_time' => now()]);
    }
}