<?php
// ============================================
// app/Http/Controllers/Api/Auth/AuthController.php
// ============================================
namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;

class AuthController extends Controller
{
    /**
     * Register Siswa Baru
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'school' => 'nullable|string|max:255',
            'parent_name' => 'nullable|string|max:255',
            'parent_phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get role siswa
        $studentRole = Role::where('name', 'siswa')->first();

        // Create user
        $user = User::create([
            'role_id' => $studentRole->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'is_active' => true,
        ]);

        // Create student profile
        $studentNumber = 'STD-' . date('Y') . '-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
        
        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => $studentNumber,
            'birth_date' => $request->birth_date,
            'school' => $request->school,
            'parent_name' => $request->parent_name,
            'parent_phone' => $request->parent_phone,
        ]);

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->name,
                    'student_number' => $student->student_number,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ]
        ], 201);
    }

    /**
     * Login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Silakan hubungi admin.'
            ], 403);
        }

        // Delete old tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->name,
            'role_display' => $user->role->display_name,
        ];

        // Add student info if role is student
        if ($user->isStudent() && $user->student) {
            $userData['student'] = [
                'student_number' => $user->student->student_number,
                'school' => $user->student->school,
                'last_tryout_score' => $user->student->last_tryout_score,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $userData,
                'token' => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }

    /**
     * Get User Profile
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load('role');
        
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'role' => $user->role->name,
            'role_display' => $user->role->display_name,
        ];

        if ($user->isStudent() && $user->student) {
            $userData['student'] = [
                'student_number' => $user->student->student_number,
                'birth_date' => $user->student->birth_date,
                'address' => $user->student->address,
                'school' => $user->student->school,
                'parent_name' => $user->student->parent_name,
                'parent_phone' => $user->student->parent_phone,
                'total_attendance' => $user->student->total_attendance,
                'last_tryout_score' => $user->student->last_tryout_score,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $userData
        ]);
    }

    /**
     * Update Profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'avatar' => 'sometimes|image|max:2048',
            // Student fields
            'address' => 'sometimes|string',
            'school' => 'sometimes|string|max:255',
            'parent_name' => 'sometimes|string|max:255',
            'parent_phone' => 'sometimes|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user data
        $user->update($request->only(['name', 'phone']));

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }

        // Update student data if applicable
        if ($user->isStudent() && $user->student) {
            $user->student->update($request->only([
                'address', 'school', 'parent_name', 'parent_phone'
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => $user->fresh()->load('role', 'student')
        ]);
    }

    /**
     * Refresh Token
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        
        // Delete current token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token berhasil diperbarui',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }
}