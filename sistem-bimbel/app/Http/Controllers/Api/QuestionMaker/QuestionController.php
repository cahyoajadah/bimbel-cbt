<?php
// ============================================
// app/Http/Controllers/Api/QuestionMaker/QuestionController.php
// ============================================
namespace App\Http\Controllers\Api\QuestionMaker;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
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
            $imagePath = null;
            if ($request->hasFile('question_image')) {
                $imagePath = $request->file('question_image')->store('questions', 'public');
            }

            $question = Question::create([
                'question_package_id' => $packageId,
                'type' => $request->type,
                'question_text' => $request->question_text,
                'question_image' => $imagePath,
                'point' => $request->point,
                'explanation' => $request->explanation, // <--- [PERBAIKAN] Tambahkan ini
                'order_number' => Question::where('question_package_id', $packageId)->max('order_number') + 1,
            ]);

            // ... (Sisa kode simpan options biarkan sama) ...
            if ($request->has('options')) {
                foreach ($request->options as $index => $optionData) {
                    // ... (Logika simpan opsi sama seperti sebelumnya) ...
                    $optionImagePath = null;
                    if (isset($optionData['option_image']) && $optionData['option_image'] instanceof \Illuminate\Http\UploadedFile) {
                        $optionImagePath = $optionData['option_image']->store('options', 'public');
                    }

                    $label = $request->type === 'short' ? null : chr(65 + $index);

                    $question->answerOptions()->create([
                        'option_label' => $label,
                        'option_text' => $optionData['option_text'] ?? '',
                        'option_image' => $optionImagePath,
                        'is_correct' => filter_var($optionData['is_correct'], FILTER_VALIDATE_BOOLEAN),
                        'weight' => $optionData['weight'] ?? 0,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Soal berhasil dibuat'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
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

    public function update(StoreQuestionRequest $request, $packageId, $id)
    {
        $question = Question::where('question_package_id', $packageId)->findOrFail($id);

        DB::beginTransaction();
        try {
            $dataToUpdate = [
                'type' => $request->type,
                'question_text' => $request->question_text,
                'point' => $request->point,
                'explanation' => $request->explanation, // <--- [PERBAIKAN] Tambahkan ini
            ];

            if ($request->hasFile('question_image')) {
                // Hapus gambar lama jika perlu (opsional)
                $dataToUpdate['question_image'] = $request->file('question_image')->store('questions', 'public');
            }

            $question->update($dataToUpdate);

            // Hapus opsi lama & buat baru (Simplest approach)
            $question->answerOptions()->delete();

            if ($request->has('options')) {
                foreach ($request->options as $index => $optionData) {
                    // ... (Logika simpan opsi sama seperti di store) ...
                    $optionImagePath = null;
                    if (isset($optionData['option_image']) && $optionData['option_image'] instanceof \Illuminate\Http\UploadedFile) {
                        $optionImagePath = $optionData['option_image']->store('options', 'public');
                    } elseif (isset($optionData['image_url'])) {
                        // Keep old image if sent back as URL (optional logic)
                        $optionImagePath = str_replace(url('storage').'/', '', $optionData['image_url']);
                    }

                    $label = $request->type === 'short' ? null : chr(65 + $index);

                    $question->answerOptions()->create([
                        'option_label' => $label,
                        'option_text' => $optionData['option_text'] ?? '',
                        'option_image' => $optionImagePath,
                        'is_correct' => filter_var($optionData['is_correct'], FILTER_VALIDATE_BOOLEAN),
                        'weight' => $optionData['weight'] ?? 0,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Soal berhasil diperbarui']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
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
