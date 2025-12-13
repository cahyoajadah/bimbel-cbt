<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // ← Tambahkan routing API
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
         // ===== Custom Alias Middleware Kamu =====
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'cbt.session' => \App\Http\Middleware\CheckCbtSession::class,
        ]);

        // ===== Sanctum Middleware for API Rate Limiting =====
        // Ditaruh sebelum middleware lain
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Custom Rate Limiting
        // $middleware->throttle([
        //     'api' => Limit::perMinute(60),
        //     'login' => Limit::perMinute(5),
        //     'cbt' => Limit::perMinute(120),
        // ]);

        // Jika kamu ingin tambahkan throttle api:
        // $middleware->throttleApi(); // Optional, tergantung konfigurasi
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //TAMBAHAN 
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource tidak ditemukan'
                ], 404);
            }
        });
    })->create();
