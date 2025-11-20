<?php
// ============================================
// app/Http/Controllers/Api/Student/CBTController.php
// ============================================
namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\CbtSession;
use App\Models\StudentAnswer;
use App\Models\StudentTryoutResult;
use App\Models\QuestionReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CBTController extends Controller
{
    /**
     * Get available tryout packages for student
     */
    public function availableTryouts(Request $request)
    {
        $student = $request->user()->student;
        
        $tryouts = QuestionPackage::with('program')
            ->where('is_active', true)
            ->where('total_questions', '>', 0)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tryouts
        ]);
    }

    /**
     * Start CBT session
     */
    public function startSession(Request $request, $packageId)
    {
        $student = $request->user()->student;
        $package = QuestionPackage::findOrFail($packageId);

        if (!$package->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Paket tryout tidak aktif'
            ], 400);
        }

        // Check if student has ongoing session
        $ongoingSession = CbtSession::where('student_id', $student->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki sesi tryout yang aktif'
            ], 409);
        }

        DB::beginTransaction();
        try {
            // Create CBT session
            $session = CbtSession::create([
                'student_id' => $student->id,
                'question_package_id' => $package->id,
                'session_token' => Str::random(64),
                'start_time' => now(),
                'status' => 'ongoing',
                'is_fullscreen' => true,
            ]);

            // Create empty answers for all questions
            $questions = $package->questions;
            foreach ($questions as $question) {
                StudentAnswer::create([
                    'cbt_session_id' => $session->id,
                    'question_id' => $question->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sesi CBT dimulai',
                'data' => [
                    'session_token' => $session->session_token,
                    'session_id' => $session->id,
                    'package' => $package,
                    'duration_minutes' => $package->duration_minutes,
                    'total_questions' => $package->total_questions,
                    'start_time' => $session->start_time,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memulai sesi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questions for CBT session
     */
    public function getQuestions(Request $request)
    {
        $session = $request->cbt_session;
        
        $questions = $session->questionPackage->questions()
            ->with(['answerOptions' => function($query) {
                $query->select('id', 'question_id', 'option_label', 'option_text', 'option_image');
            }])
            ->orderBy('order_number')
            ->get()
            ->map(function($question) {
                return [
                    'id' => $question->id,
                    'order_number' => $question->order_number,
                    'question_text' => $question->question_text,
                    'question_image' => $question->question_image,
                    'duration_seconds' => $question->duration_seconds,
                    'options' => $question->answerOptions->map(function($option) {
                        return [
                            'id' => $option->id,
                            'label' => $option->option_label,
                            'text' => $option->option_text,
                            'image' => $option->option_image,
                        ];
                    }),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $questions
        ]);
    }

    /**
     * Save answer (auto-save)
     */
    public function saveAnswer(Request $request)
    {
        $session = $request->cbt_session;

        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer_option_id' => 'required|exists:answer_options,id',
        ]);

        $answer = StudentAnswer::where('cbt_session_id', $session->id)
            ->where('question_id', $request->question_id)
            ->first();

        if (!$answer) {
            return response()->json([
                'success' => false,
                'message' => 'Jawaban tidak ditemukan'
            ], 404);
        }

        $answer->update([
            'answer_option_id' => $request->answer_option_id,
            'answered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jawaban berhasil disimpan'
        ]);
    }

    /**
     * Submit tryout
     */
    public function submitTryout(Request $request)
    {
        $session = $request->cbt_session;

        DB::beginTransaction();
        try {
            // Calculate results
            $answers = $session->answers()->with(['question', 'answerOption'])->get();
            
            $totalQuestions = $answers->count();
            $answeredQuestions = $answers->whereNotNull('answer_option_id')->count();
            $correctAnswers = 0;
            $totalScore = 0;

            foreach ($answers as $answer) {
                if ($answer->answer_option_id) {
                    $isCorrect = $answer->answerOption->is_correct;
                    $answer->update([
                        'is_correct' => $isCorrect,
                        'point_earned' => $isCorrect ? $answer->question->point : 0,
                    ]);

                    if ($isCorrect) {
                        $correctAnswers++;
                        $totalScore += $answer->question->point;
                    }
                }
            }

            $wrongAnswers = $answeredQuestions - $correctAnswers;
            $maxScore = $session->questionPackage->questions->sum('point');
            $percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;
            $isPassed = $session->questionPackage->passing_score 
                ? $totalScore >= $session->questionPackage->passing_score 
                : false;

            // Save result
            $durationSeconds = now()->diffInSeconds($session->start_time);
            
            $result = StudentTryoutResult::create([
                'cbt_session_id' => $session->id,
                'student_id' => $session->student_id,
                'question_package_id' => $session->question_package_id,
                'total_questions' => $totalQuestions,
                'answered_questions' => $answeredQuestions,
                'correct_answers' => $correctAnswers,
                'wrong_answers' => $wrongAnswers,
                'total_score' => $totalScore,
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'duration_seconds' => $durationSeconds,
            ]);

            // Update session
            $session->update([
                'end_time' => now(),
                'status' => 'completed',
            ]);

            // Update student last score
            $session->student->update([
                'last_tryout_score' => $totalScore,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tryout berhasil di-submit',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal submit tryout: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Review result with answers & explanation
     */
    public function reviewResult(Request $request, $resultId)
    {
        $student = $request->user()->student;
        
        $result = StudentTryoutResult::with([
            'cbtSession.answers.question.answerOptions',
            'cbtSession.answers.answerOption'
        ])
        ->where('student_id', $student->id)
        ->findOrFail($resultId);

        $review = $result->cbtSession->answers->map(function($answer) {
            $question = $answer->question;
            $correctOption = $question->answerOptions->where('is_correct', true)->first();
            
            return [
                'question_number' => $question->order_number,
                'question_text' => $question->question_text,
                'question_image' => $question->question_image,
                'your_answer' => $answer->answerOption ? $answer->answerOption->option_label : null,
                'correct_answer' => $correctOption->option_label,
                'is_correct' => $answer->is_correct,
                'point_earned' => $answer->point_earned,
                'explanation' => $question->explanation,
                'explanation_image' => $question->explanation_image,
                'options' => $question->answerOptions->map(function($option) {
                    return [
                        'label' => $option->option_label,
                        'text' => $option->option_text,
                        'is_correct' => $option->is_correct,
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'result' => $result,
                'review' => $review,
            ]
        ]);
    }

    /**
     * Report question
     */
    public function reportQuestion(Request $request)
    {
        $student = $request->user()->student;

        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'report_content' => 'required|string',
        ]);

        $report = QuestionReport::create([
            'question_id' => $request->question_id,
            'student_id' => $student->id,
            'report_content' => $request->report_content,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dikirim',
            'data' => $report
        ], 201);
    }

    /**
     * Fullscreen warning
     */
    public function fullscreenWarning(Request $request)
    {
        $session = $request->cbt_session;
        $session->increment('warning_count');

        if ($session->warning_count >= 3) {
            // Auto submit after 3 warnings
            $session->update([
                'status' => 'auto_submit',
                'end_time' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Tryout otomatis di-submit karena keluar fullscreen 3x',
                'auto_submit' => true
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => "Peringatan {$session->warning_count}/3: Jangan keluar dari fullscreen!",
            'warning_count' => $session->warning_count
        ]);
    }
}