<?php
// app/Exceptions/Handler.php
// public function register()
// {
//     $this->reportable(function (Throwable $e) {
//         // Log ke file atau external service
//         Log::error('Application Error', [
//             'message' => $e->getMessage(),
//             'trace' => $e->getTraceAsString(),
//             'user' => auth()->id(),
//         ]);
//     });

//     $this->renderable(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
//         if ($request->is('api/*')) {
//             return response()->json([
//                 'success' => false,
//                 'message' => 'Resource tidak ditemukan'
//             ], 404);
//         }
//     });
// }