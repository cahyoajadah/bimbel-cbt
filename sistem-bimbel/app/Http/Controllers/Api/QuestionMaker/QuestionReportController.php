<?php
// ============================================
// app/Http/Controllers/Api/QuestionMaker/QuestionReportController.php
// ============================================
namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionReport;
use Illuminate\Http\Request;

class QuestionReportController extends Controller
{
    public function index(Request $request)
    {
        $query = QuestionReport::with(['question.package', 'student.user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reports = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    public function respond(Request $request, $id)
    {
        $report = QuestionReport::findOrFail($id);

        $request->validate([
            'admin_response' => 'required|string',
            'status' => 'required|in:reviewed,resolved',
        ]);

        $report->update([
            'admin_response' => $request->admin_response,
            'status' => $request->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Respon berhasil disimpan',
            'data' => $report
        ]);
    }
}