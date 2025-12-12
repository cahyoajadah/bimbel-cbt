<?php
// ============================================
// app/Services/CBTService.php
// ============================================
namespace App\Services;

use App\Models\CbtSession;
use App\Models\QuestionPackage;
use App\Models\StudentAnswer;
use App\Models\StudentTryoutResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CBTService
{
    /**
     * Start a new CBT session
     */
    public function startSession($studentId, $packageId)
    {
        $package = QuestionPackage::findOrFail($packageId);

        if (!$package->is_active) {
            throw new \Exception('Paket tryout tidak aktif');
        }

        // Check ongoing session
        $ongoingSession = CbtSession::where('student_id', $studentId)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            throw new \Exception('Anda masih memiliki sesi tryout yang aktif');
        }

        DB::beginTransaction();
        try {
            $session = CbtSession::create([
                'student_id' => $studentId,
                'question_package_id' => $packageId,
                'session_token' => Str::random(64),
                'start_time' => now(),
                'status' => 'ongoing',
                'is_fullscreen' => true,
            ]);

            // Create empty answers
            $questions = $package->questions;
            foreach ($questions as $question) {
                StudentAnswer::create([
                    'cbt_session_id' => $session->id,
                    'question_id' => $question->id,
                ]);
            }

            DB::commit();

            return $session;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Submit tryout and calculate results
     */
    public function submitTryout(CbtSession $session)
    {
        DB::beginTransaction();
        try {
            $answers = $session->answers()->with(['question', 'answerOption'])->get();
            
            $totalQuestions = $answers->count();
            $answeredQuestions = $answers->whereNotNull('answer_option_id')->count();
            $correctAnswers = 0;
            $totalScore = 0;

            foreach ($answers as $answer) {
                if ($answer->answer_option_id) {
                    $isCorrect = $answer->answerOption->is_correct;
                    $pointEarned = $isCorrect ? $answer->question->point : 0;

                    $answer->update([
                        'is_correct' => $isCorrect,
                        'point_earned' => $pointEarned,
                    ]);

                    if ($isCorrect) {
                        $correctAnswers++;
                        $totalScore += $pointEarned;
                    }
                }
            }

            $wrongAnswers = $answeredQuestions - $correctAnswers;
            $maxScore = $session->questionPackage->questions->sum('point');
            $percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;
            $isPassed = $session->questionPackage->passing_score 
                ? $totalScore >= $session->questionPackage->passing_score 
                : false;

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

            $session->update([
                'end_time' => now(),
                'status' => 'completed',
            ]);

            $session->student->update([
                'last_tryout_score' => $totalScore,
            ]);

            DB::commit();

            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Handle fullscreen warning
     */
    public function handleFullscreenWarning(CbtSession $session)
    {
        $session->increment('warning_count');

        if ($session->warning_count >= 2) {
            $session->update([
                'status' => 'auto_submit',
                'end_time' => now(),
            ]);

            return [
                'auto_submit' => true,
                'message' => 'Tryout otomatis di-submit karena keluar fullscreen 3x'
            ];
        }

        return [
            'auto_submit' => false,
            'warning_count' => $session->warning_count,
            'message' => "Peringatan {$session->warning_count}/3: Jangan keluar dari fullscreen!"
        ];
    }
}
