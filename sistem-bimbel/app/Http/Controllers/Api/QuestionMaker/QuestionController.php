<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuestionController extends Controller
{
    public function index($packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);
        
        // [FIX] Tambahkan with('answerOptions') di sini!
        // Tanpa ini, frontend tidak akan menerima data opsi jawaban saat tombol Edit ditekan
        $questions = $package->questions()
                             ->with('answerOptions') 
                             ->orderBy('order_number')
                             ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'package' => $package,
                'questions' => $questions
            ]
        ]);
    }

    public function store(Request $request, $packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:single,multiple,weighted,short',
            'question_text' => 'required|string',
            'point' => 'required|numeric|min:0',
            'duration_seconds' => 'nullable|integer|min:0',
            'explanation' => 'nullable|string',
            'options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Tentukan nomor urut otomatis
            $lastOrder = $package->questions()->max('order_number') ?? 0;

            $question = $package->questions()->create([
                'type' => $request->type,
                'question_text' => $request->question_text,
                'point' => $request->point,
                'duration_seconds' => $request->duration_seconds ?? 60,
                'explanation' => $request->explanation,
                'order_number' => $lastOrder + 1,
            ]);

            // Simpan Opsi Jawaban
            if ($request->has('options')) {
                foreach ($request->options as $opt) {
                    $question->answerOptions()->create([
                        'option_label' => $opt['label'] ?? null,
                        'option_text' => $opt['option_text'] ?? $opt['text'] ?? '', 
                        'is_correct' => $opt['is_correct'] ?? false,
                        'weight' => $opt['weight'] ?? 0,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Soal berhasil ditambahkan',
                'data' => $question->load('answerOptions')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan soal: ' . $e->getMessage()], 500);
        }
    }

    public function show($packageId, $id)
    {
        $question = Question::with('answerOptions')
            ->where('question_package_id', $packageId)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $question]);
    }

    public function update(Request $request, $packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:single,multiple,weighted,short',
            'question_text' => 'required|string',
            'point' => 'required|numeric|min:0',
            'duration_seconds' => 'nullable|integer|min:0',
            'explanation' => 'nullable|string',
            'options' => 'nullable|array',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        DB::beginTransaction();
        try {
            $question->update([
                'type' => $request->type,
                'question_text' => $request->question_text,
                'point' => $request->point,
                'duration_seconds' => $request->duration_seconds,
                'explanation' => $request->explanation,
            ]);

            // Update Opsi: Hapus semua lalu buat ulang
            if ($request->has('options')) {
                $question->answerOptions()->delete();
                
                foreach ($request->options as $opt) {
                    $question->answerOptions()->create([
                        'option_label' => $opt['label'] ?? null,
                        'option_text' => $opt['option_text'] ?? $opt['text'] ?? '',
                        'is_correct' => $opt['is_correct'] ?? false,
                        'weight' => $opt['weight'] ?? 0,
                    ]);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => 'Soal berhasil diperbarui', 
                'data' => $question->load('answerOptions')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal update: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);
        
        DB::beginTransaction();
        try {
            $question->delete(); 
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Soal berhasil dihapus']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal menghapus: ' . $e->getMessage()], 500);
        }
    }
}