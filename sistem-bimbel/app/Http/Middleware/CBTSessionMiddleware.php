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
        $sessionToken = $request->header('X-CBT-Session-Token');

        if (!$sessionToken) {
            return response()->json([
                'success' => false,
                'message' => 'Session token CBT tidak ditemukan.'
            ], 401);
        }

        $session = CbtSession::where('session_token', $sessionToken)
            ->where('status', 'ongoing')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session CBT tidak valid atau sudah berakhir.'
            ], 401);
        }

        // Validasi apakah session milik user yang login
        if ($session->student_id !== $request->user()->student->id) {
            return response()->json([
                'success' => false,
                'message' => 'Session CBT bukan milik Anda.'
            ], 403);
        }

        // Cek apakah ada session lain yang ongoing
        $otherOngoingSession = CbtSession::where('student_id', $session->student_id)
            ->where('id', '!=', $session->id)
            ->where('status', 'ongoing')
            ->exists();

        if ($otherOngoingSession) {
            return response()->json([
                'success' => false,
                'message' => 'Anda memiliki session CBT lain yang masih aktif.'
            ], 409);
        }

        $request->merge(['cbt_session' => $session]);

        return $next($request);
    }
}