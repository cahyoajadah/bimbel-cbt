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

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreQuestionRequest $request, $packageId)
    {
        DB::beginTransaction();
        try {
            // 1. Upload Gambar Soal (Jika Ada)
            $imagePath = null;
            if ($request->hasFile('question_image')) {
                $imagePath = $request->file('question_image')->store('questions', 'public');
            }

            // 2. Buat Soal
            $question = Question::create([
                'question_package_id' => $packageId,
                'type' => $request->type, // Simpan tipe soal
                'question_text' => $request->question_text,
                'question_image' => $imagePath,
                'point' => $request->point,
                'order_number' => Question::where('question_package_id', $packageId)->max('order_number') + 1,
            ]);

            // 3. Buat Opsi Jawaban
            if ($request->has('options')) {
                foreach ($request->options as $index => $optionData) {
                    
                    // Handle gambar per opsi (karena array, aksesnya agak tricky)
                    $optionImagePath = null;
                    if (isset($optionData['option_image']) && $optionData['option_image'] instanceof \Illuminate\Http\UploadedFile) {
                        $optionImagePath = $optionData['option_image']->store('options', 'public');
                    }

                    // Tentukan Label (A, B, C...) atau Kosong jika Isian Singkat
                    $label = $request->type === 'short' ? null : chr(65 + $index); // 65 = A

                    $question->answerOptions()->create([
                        'option_label' => $label,
                        'option_text' => $optionData['option_text'] ?? '', // Bisa kosong jika cuma gambar
                        'option_image' => $optionImagePath,
                        'is_correct' => filter_var($optionData['is_correct'], FILTER_VALIDATE_BOOLEAN),
                        'weight' => $optionData['weight'] ?? 0, // Simpan bobot (default 0)
                    ]);
                }
            }

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
