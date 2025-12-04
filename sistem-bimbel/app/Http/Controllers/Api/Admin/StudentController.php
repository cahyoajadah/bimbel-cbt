<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str; 
use App\Mail\NewStudentAccount;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['user', 'programs']);

        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->whereHas('user', function($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            })->orWhere('school', 'like', "%{$searchTerm}%")
              ->orWhere('student_number', 'like', "%{$searchTerm}%");
        }

        $students = $query->join('users', 'students.user_id', '=', 'users.id')
                          ->select('students.*') 
                          ->orderBy('users.name', 'asc')
                          ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'required|string|max:20',
            'student_number' => 'required|string|max:50|unique:students,student_number',
            'school' => 'required|string|max:255',
            'address' => 'required|string',
            'birth_date' => 'required|date',
            'parent_name' => 'required|string|max:255',
            'parent_phone' => 'required|string|max:20',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'exists:programs,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        DB::beginTransaction();
        try {
            $role = Role::where('name', 'siswa')->firstOrFail();
            
            // 1. Simpan Password Asli (Input Admin) untuk dikirim via Email
            $rawPassword = $request->password;

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($rawPassword), // Hash untuk DB
                'phone' => $request->phone,
                'role_id' => $role->id,
                'is_active' => true,
            ]);

            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $request->student_number,
                'school' => $request->school,
                'address' => $request->address,
                'birth_date' => $request->birth_date,
                'parent_name' => $request->parent_name,
                'parent_phone' => $request->parent_phone,
            ]);

            if ($request->has('program_ids')) {
                $syncData = [];
                foreach ($request->program_ids as $programId) {
                    $syncData[$programId] = ['start_date' => now()];
                }
                $student->programs()->sync($syncData);
            }

            DB::commit();

            // 2. Kirim Email Pendaftaran Awal
            try {
                Mail::to($user->email)->send(new NewStudentAccount($user, $rawPassword));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal kirim email store: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Siswa berhasil ditambahkan', 'data' => $student->load('user')], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // [FITUR] Reset Password & Kirim Email Manual
    public function sendAccountInfo($id)
    {
        $student = Student::with('user')->findOrFail($id);
        $user = $student->user;

        // 1. Buat Password Baru Acak
        $newPassword = Str::random(8); 

        // 2. Update Database
        $user->password = Hash::make($newPassword);
        $user->save();

        // 3. Kirim Email
        try {
            Mail::to($user->email)->send(new NewStudentAccount($user, $newPassword));
            return response()->json(['success' => true, 'message' => 'Password di-reset dan dikirim ke email siswa']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengirim email: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $user = $student->user;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:20',
            'password' => 'nullable|string|min:8',
            'student_number' => 'required|string|max:50|unique:students,student_number,' . $student->id,
            'school' => 'required|string|max:255',
            'address' => 'required|string',
            'birth_date' => 'required|date',
            'parent_name' => 'required|string|max:255',
            'parent_phone' => 'required|string|max:20',
            'program_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        DB::beginTransaction();
        try {
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
            ];
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $user->update($userData);

            $student->update([
                'student_number' => $request->student_number,
                'school' => $request->school,
                'address' => $request->address,
                'birth_date' => $request->birth_date,
                'parent_name' => $request->parent_name,
                'parent_phone' => $request->parent_phone,
            ]);

            if ($request->has('program_ids')) {
                $syncData = [];
                foreach ($request->program_ids as $programId) {
                    $syncData[$programId] = ['start_date' => now()];
                }
                $student->programs()->sync($syncData);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Data diperbarui']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->user->delete(); 
        return response()->json(['success' => true, 'message' => 'Siswa berhasil dihapus']);
    }

    public function show($id)
    {
        $student = Student::with(['user', 'programs'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $student]);
    }
    
    public function progressDetail($id) {
        $student = Student::with(['user', 'tryoutResults.package'])->findOrFail($id);
        $attendanceCount = $student->attendances()->where('status', 'present')->count();
        $completedMaterials = $student->materials()->wherePivot('is_completed', true)->count();
        $recentTryouts = $student->tryoutResults()->orderBy('created_at', 'desc')->take(5)->get()->map(function($res) {
                return ['package_name' => $res->package->name ?? 'Paket dihapus', 'date' => $res->created_at->format('d M Y'), 'total_score' => $res->total_score];
        });
        $avgScore = $student->tryoutResults()->avg('total_score');
        return response()->json(['success' => true, 'data' => ['attendance_count' => $attendanceCount, 'completed_materials' => $completedMaterials, 'average_score' => round($avgScore ?? 0, 2), 'recent_tryouts' => $recentTryouts]]);
    }
}