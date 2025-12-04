<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/fix-storage', function () {
    $paths = [
        storage_path('app/public'),
        storage_path('framework/views'),
        storage_path('framework/cache/data'),
        storage_path('framework/sessions'),
        storage_path('logs'),
    ];

    foreach ($paths as $path) {
        if (!file_exists($path)) {
            mkdir($path, 0777, true);
            echo "Dibuat: $path <br>";
        } else {
            echo "Sudah ada: $path <br>";
        }
    }

    // Clear cache sekalian
    \Artisan::call('config:clear');
    \Artisan::call('view:clear');
    
    return "<br><b>SELESAI! Folder storage sudah diperbaiki. Silakan coba kirim email lagi.</b>";
});