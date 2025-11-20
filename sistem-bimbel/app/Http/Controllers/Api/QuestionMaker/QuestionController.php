<?php
// ============================================
// app/Http/Controllers/Api/QuestionMaker/QuestionController.php
// ============================================
namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionPackage;
use App\Models\AnswerOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index($packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);
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
            'question_text' => 'required|string',
            'question_image' => 'nullable|image|max:2048',
            'duration_seconds' => 'required|integer|min:1',
            'point' => 'required|numeric|min:0',
            'explanation' => 'nullable|string',
            'explanation_image' => 'nullable|image|max:2048',
            'options' => 'required|array|min:2|max:5',
            'options.*.label' => 'required|in:A,B,C,D,E',
            'options.*.text' => 'required|string',
            'options.*.image' => 'nullable|image|max:2048',
            'options.*.is_correct' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validasi harus ada 1 jawaban benar
        $correctCount = collect($request->options)->where('is_correct', true)->count();
        if ($correctCount !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Harus ada tepat 1 jawaban yang benar'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get next order number
            $lastOrder = $package->questions()->max('order_number') ?? 0;

            $questionData = $request->only([
                'question_text', 'duration_seconds', 'point', 'explanation'
            ]);
            $questionData['question_package_id'] = $packageId;
            $questionData['order_number'] = $lastOrder + 1;

            // Handle image uploads
            if ($request->hasFile('question_image')) {
                $questionData['question_image'] = $request->file('question_image')
                    ->store('questions/images', 'public');
            }

            if ($request->hasFile('explanation_image')) {
                $questionData['explanation_image'] = $request->file('explanation_image')
                    ->store('questions/explanations', 'public');
            }

            $question = Question::create($questionData);

            // Create answer options
            foreach ($request->options as $optionData) {
                $option = [
                    'question_id' => $question->id,
                    'option_label' => $optionData['label'],
                    'option_text' => $optionData['text'],
                    'is_correct' => $optionData['is_correct'],
                ];

                if (isset($optionData['image']) && $optionData['image'] instanceof \Illuminate\Http\UploadedFile) {
                    $option['option_image'] = $optionData['image']
                        ->store('questions/options', 'public');
                }

                AnswerOption::create($option);
            }

            // Update total questions in package
            $package->increment('total_questions');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Soal berhasil dibuat',
                'data' => $question->load('answerOptions')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat soal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)
            ->with('answerOptions')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $question
        ]);
    }

    public function update(Request $request, $packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'question_text' => 'sometimes|string',
            'question_image' => 'nullable|image|max:2048',
            'duration_seconds' => 'sometimes|integer|min:1',
            'point' => 'sometimes|numeric|min:0',
            'explanation' => 'nullable|string',
            'explanation_image' => 'nullable|image|max:2048',
            'options' => 'sometimes|array|min:2|max:5',
            'options.*.id' => 'sometimes|exists:answer_options,id',
            'options.*.label' => 'required|in:A,B,C,D,E',
            'options.*.text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
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
            $updateData = $request->only([
                'question_text', 'duration_seconds', 'point', 'explanation'
            ]);

            if ($request->hasFile('question_image')) {
                $updateData['question_image'] = $request->file('question_image')
                    ->store('questions/images', 'public');
            }

            if ($request->hasFile('explanation_image')) {
                $updateData['explanation_image'] = $request->file('explanation_image')
                    ->store('questions/explanations', 'public');
            }

            $question->update($updateData);

            // Update options if provided
            if ($request->has('options')) {
                foreach ($request->options as $optionData) {
                    if (isset($optionData['id'])) {
                        $option = AnswerOption::find($optionData['id']);
                        if ($option && $option->question_id == $question->id) {
                            $option->update([
                                'option_label' => $optionData['label'],
                                'option_text' => $optionData['text'],
                                'is_correct' => $optionData['is_correct'],
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Soal berhasil diperbarui',
                'data' => $question->fresh()->load('answerOptions')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui soal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);
        $package = $question->questionPackage;

        DB::beginTransaction();
        try {
            $question->delete();
            $package->decrement('total_questions');
            
            // Reorder questions
            $questions = $package->questions()->orderBy('order_number')->get();
            foreach ($questions as $index => $q) {
                $q->update(['order_number' => $index + 1]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Soal berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus soal: ' . $e->getMessage()
            ], 500);
        }
    }
}
