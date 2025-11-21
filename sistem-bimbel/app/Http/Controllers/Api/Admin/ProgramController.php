<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    /**
     * Menampilkan daftar program untuk dropdown
     */
    public function index()
    {
        // Ambil semua program, urutkan berdasarkan nama
        $programs = Program::orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $programs
        ]);
    }
}