<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\QuestionReport;
use Illuminate\Http\Request;

class QuestionReportController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        // [FIX] Perbaikan nama relasi
        // Gunakan 'question.package' sesuai nama fungsi di Model Question
        $query = QuestionReport::with([
            'student.user',     
            'question.package'  // <--- UBAH DARI 'question.questionPackage' JADI 'question.package'
        ]);

        if ($status) {
            $query->where('status', $status);
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    public function respond(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:resolved,rejected',
            'response' => 'nullable|string'
        ]);

        $report = QuestionReport::findOrFail($id);
        
        $report->update([
            'status' => $request->status,
            'admin_response' => $request->response
        ]);

        return response()->json(['success' => true, 'message' => 'Laporan diperbarui']);
    }
}