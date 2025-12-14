<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role; // [PENTING] Import Model Role
use App\Models\Teacher;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    // GET USERS (Support Multiple Roles Filtering)
    public function index(Request $request)
    {
        // Eager load relasi 'role' agar efisien
        $query = User::with('role');

        // 1. Filter Pencarian
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // 2. Filter Role (PERBAIKAN UTAMA DI SINI)
        // Kita mencari role berdasarkan 'name' di tabel 'roles', bukan kolom 'role' di tabel 'users'
        if ($request->has('roles')) {
            $roles = $request->roles;
            // Pastikan roles berbentuk array
            if (!is_array($roles)) {
                $roles = [$roles];
            }

            // Cari user yang punya relasi role dengan nama yang diminta
            $query->whereHas('role', function($q) use ($roles) {
                $q->whereIn('name', $roles);
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    // CREATE NEW STAFF (Admin & Pembuat Soal Only)
    // CREATE NEW STAFF (Hanya di tabel USERS)
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role'     => ['required', 'exists:roles,name'],
        ]);

        if (!in_array($request->role, ['admin_manajemen', 'pembuat_soal'])) {
            return response()->json(['message' => 'Role tidak valid.'], 422);
        }

        try {
            DB::beginTransaction();

            // 1. Ambil Role ID
            $roleData = Role::where('name', $request->role)->firstOrFail();

            // 2. Buat User Baru (Hanya di tabel users)
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role_id'  => $roleData->id,
            ]);

            // [DIHAPUS] Logika insert ke tabel 'teachers' sudah dibuang
            // agar tidak menyebabkan error dan sesuai permintaan Anda.

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Akun {$request->role} berhasil dibuat.",
                'data'    => $user
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }
        
        // Cegah hapus diri sendiri
        if ($user->id === auth()->id()) {
             return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true, 
            'message' => 'User berhasil dihapus.'
        ]);
    }
}