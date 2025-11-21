<?php
// ============================================
// app/Http/Controllers/Api/Admin/StudentController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['user', 'programs']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $students = $query->paginate($request->get('per_page', 15));

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
            'program_id' => 'required|exists:programs,id', // <--- Wajib pilih program
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

        DB::beginTransaction();
        try {
            $studentRole = Role::where('name', 'siswa')->first();

            $user = User::create([
                'role_id' => $studentRole->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            $studentNumber = 'STD-' . date('Y') . '-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
            
            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $studentNumber,
                'birth_date' => $request->birth_date,
                'school' => $request->school,
                'parent_name' => $request->parent_name,
                'parent_phone' => $request->parent_phone,
            ]);

            // 3. Attach Program dengan Tanggal Mulai Hari Ini
            $student->programs()->attach($request->program_id, [
                'start_date' => now(), // <--- Tambahkan ini
                'is_active' => true
            ]);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Siswa berhasil dibuat',
                'data' => $student->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat siswa: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $student = Student::with(['user', 'programs.program'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $student
        ]);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $student->user_id,
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

        DB::beginTransaction();
        try {
            $student->user->update($request->only(['name', 'email', 'phone']));
            $student->update($request->only([
                'birth_date', 'school', 'parent_name', 'parent_phone'
            ]));

            //$student->programs()->sync([$request->program_id]);
            // Update Program (Ganti yang lama dengan yang baru + reset tanggal mulai)
            $student->programs()->sync([
                $request->program_id => [
                    'start_date' => now(), // <--- Tambahkan ini
                    'is_active' => true
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Siswa berhasil diperbarui',
                'data' => $student->fresh()->load('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui siswa: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->programs()->detach();

        if ($student->user) {
            $student->user->delete();
        } else {
            // Fallback jika user tidak ditemukan, hapus student saja
            $student->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil dihapus'
        ]);
    }

    public function assignProgram(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $request->validate([
            'program_id' => 'required|exists:programs,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $student->programs()->create([
            'program_id' => $request->program_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Program berhasil di-assign'
        ]);
    }

    public function getAttendance($id)
    {
        $student = Student::findOrFail($id);
        $attendances = $student->attendances()
            ->with('schedule')
            ->orderBy('attendance_date', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $attendances
        ]);
    }

    public function recordAttendance(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $request->validate([
            'schedule_id' => 'nullable|exists:schedules,id',
            'attendance_date' => 'required|date',
            'status' => 'required|in:hadir,izin,sakit,alpha',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::create([
            'student_id' => $student->id,
            'schedule_id' => $request->schedule_id,
            'attendance_date' => $request->attendance_date,
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        if ($request->status === 'hadir') {
            $student->increment('total_attendance');
        }

        return response()->json([
            'success' => true,
            'message' => 'Kehadiran berhasil dicatat',
            'data' => $attendance
        ], 201);
    }
}
