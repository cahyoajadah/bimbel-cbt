<?php
// ============================================
// app/Http/Controllers/Api/Admin/FeedbackController.php
// ============================================
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::with(['student.user', 'admin']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        $feedbacks = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $feedbacks
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'month' => 'required|string|regex:/^\d{4}-\d{2}$/',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $feedback = Feedback::create([
            'student_id' => $request->student_id,
            'admin_id' => $request->user()->id,
            'month' => $request->month,
            'content' => $request->input('content'), // PERBAIKAN DI SINI
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Feedback berhasil dibuat',
            'data' => $feedback->load(['student.user', 'admin'])
        ], 201);
    }

    public function show($id)
    {
        $feedback = Feedback::with(['student.user', 'admin'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $feedback
        ]);
    }

    public function update(Request $request, $id)
    {
        $feedback = Feedback::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $feedback->update(['content' => $request->input('content')]); // PERBAIKAN DI SINI

        return response()->json([
            'success' => true,
            'message' => 'Feedback berhasil diperbarui',
            'data' => $feedback->fresh()->load(['student.user', 'admin'])
        ]);
    }

    public function destroy($id)
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback berhasil dihapus'
        ]);
    }
}
