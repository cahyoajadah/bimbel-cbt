<?php

namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\AnswerOption;
use App\Http\Requests\StoreQuestionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index($packageId)
    {
        // [FIX] Eager load 'category' agar namanya bisa diambil di frontend
        $questions = Question::with(['category', 'answerOptions'])
            ->where('question_package_id', $packageId)
            ->orderBy('order_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $questions
        ]);
    }

    public function store(StoreQuestionRequest $request, $packageId)
    {
        DB::beginTransaction();
        try {
            $imagePath = null;
            if ($request->hasFile('question_image')) {
                $imagePath = $request->file('question_image')->store('questions', 'public');
            }

            // [FIX] Gunakan $packageId dari route parameter agar aman
            $question = Question::create([
                'question_package_id' => $packageId,
                'question_category_id' => $request->question_category_id,
                'type' => $request->type,
                'question_text' => $request->question_text,
                'question_image' => $imagePath,
                'point' => $request->point,
                'order_number' => Question::where('question_package_id', $packageId)->count() + 1,
                'explanation' => $request->discussion ?? $request->explanation,
            ]);

            if ($request->has('options') && is_array($request->options)) {
                foreach ($request->options as $opt) {
                    AnswerOption::create([
                        'question_id' => $question->id,
                        'option_label' => $opt['label'] ?? null,
                        'option_text' => $opt['text'] ?? '',
                        'is_correct' => $opt['is_correct'] ?? false,
                        'weight' => $opt['weight'] ?? 0,
                    ]);
                }
            }

            $question->load('category');

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Soal berhasil dibuat', 'data' => $question]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($packageId, $id)
    {
        $question = Question::with(['answerOptions', 'category'])
            ->where('question_package_id', $packageId)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $question]);
    }

    public function update(Request $request, $packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);
        
        // Pastikan validasi ada
        $request->validate([
            'question_category_id' => 'required|exists:question_categories,id',
            'question_text' => 'required',
        ]);

        $dataToUpdate = $request->only([
            'question_category_id', // [FIX] Pastikan field ini di-update
            'type', 
            'question_text', 
            'point',
            'explanation'
        ]);
        
        // Handle Explanation/Discussion field naming
        if ($request->has('discussion')) {
            $dataToUpdate['explanation'] = $request->discussion;
        }

        if ($request->hasFile('question_image')) {
            $dataToUpdate['question_image'] = $request->file('question_image')->store('questions', 'public');
        }

        $question->update($dataToUpdate);

        if ($request->has('options')) {
            $question->answerOptions()->delete();
            foreach ($request->options as $opt) {
                AnswerOption::create([
                    'question_id' => $question->id,
                    'option_label' => $opt['label'] ?? null,
                    'option_text' => $opt['text'] ?? '',
                    'is_correct' => $opt['is_correct'] ?? false,
                    'weight' => $opt['weight'] ?? 0,
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Soal diperbarui']);
    }

    public function destroy($packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);
        $question->delete();
        return response()->json(['success' => true, 'message' => 'Soal dihapus']);
    }
}