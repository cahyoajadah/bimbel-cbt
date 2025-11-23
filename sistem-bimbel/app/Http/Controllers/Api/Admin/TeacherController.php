<?php
// ============================================
// app/Http/Controllers/Api/Admin/TeacherController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        // PENTING: Gunakan with('user')
        $query = Teacher::with('user'); 

        if ($request->has('search')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }
        
        // [PERBAIKAN] Urutkan berdasarkan nama user (Kolom yang ada)
        // Kita tidak bisa orderBy('name') langsung, harus join atau order by relationship
        // Karena ini paginated, kita akan tetap pakai paginate di akhir
        
        $teachers = $query->join('users', 'teachers.user_id', '=', 'users.id')
                          ->select('teachers.*') // Pilih semua kolom teachers
                          ->orderBy('users.name', 'asc') // Urutkan berdasarkan nama user
                          ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $teachers
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create user with admin_manajemen role (or create teacher role)
            $role = Role::where('name', 'admin_manajemen')->first();

            $user = User::create([
                'role_id' => $role->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            $teacher = Teacher::create([
                'user_id' => $user->id,
                'specialization' => $request->specialization,
                'education' => $request->education,
                'bio' => $request->bio,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembimbing berhasil dibuat',
                'data' => $teacher->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pembimbing: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $teacher = Teacher::with('user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $teacher
        ]);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $teacher->user_id,
            'phone' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $teacher->user->update($request->only(['name', 'email', 'phone']));
            $teacher->update($request->only(['specialization', 'education', 'bio']));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembimbing berhasil diperbarui',
                'data' => $teacher->fresh()->load('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui pembimbing: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $teacher = Teacher::findOrFail($id);
        $teacher->user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pembimbing berhasil dihapus'
        ]);
    }
}