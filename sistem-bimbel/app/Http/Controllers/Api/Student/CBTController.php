<?php
namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\QuestionPackage;
use App\Models\CbtSession;
use App\Models\StudentAnswer;
use App\Models\StudentTryoutResult;
use App\Models\QuestionReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; // [WAJIB] Untuk Str::random
use Illuminate\Support\Facades\Log; // [WAJIB] Untuk Log::info

class CBTController extends Controller
{
    // Helper function untuk cek siswa
    private function getStudentOrAbort(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            abort(response()->json(['message' => 'Akun ini bukan akun siswa yang valid'], 403));
        }
        return $student;
    }

    // [BARU] Helper function untuk menghitung nilai & finalize sesi
    private function calculateResult(CbtSession $session)
    {
        // 1. Ambil data
        $answers = $session->answers()->with(['question.answerOptions', 'answerOption'])->get();
        $package = $session->questionPackage;

        $totalScore = 0;
        $scoreTwk = 0;
        $scoreTiu = 0;
        $scoreTkp = 0;

        $correctCount = 0;
        $answeredCount = 0;

        // 2. Loop Penilaian
        foreach ($answers as $ans) {
            $q = $ans->question;
            $point = 0;
            $isCorrect = false;

            if ($ans->answer_option_id || $ans->answer_text || !empty($ans->selected_options)) {
                $answeredCount++;
            }

            // --- LOGIKA SKORING ---
            if ($q->type === 'weighted') {
                if ($ans->answer_option_id) {
                    $selectedOpt = $q->answerOptions->where('id', $ans->answer_option_id)->first();
                    $point = $selectedOpt ? $selectedOpt->weight : 0;
                    $maxWeight = $q->answerOptions->max('weight');
                    $isCorrect = $point == $maxWeight;
                }
            } elseif ($q->type === 'multiple') {
                if (!empty($ans->selected_options)) {
                    $correctIds = $q->answerOptions->where('is_correct', true)->pluck('id')->toArray();
                    $studentIds = $ans->selected_options;
                    $totalCorrectOptions = count($correctIds);
                    $pointPerItem = $totalCorrectOptions > 0 ? ($q->point / $totalCorrectOptions) : 0;
                    $matches = count(array_intersect($studentIds, $correctIds));
                    $point = $matches * $pointPerItem;
                    if ($point > $q->point) $point = $q->point;
                    $isCorrect = ($point == $q->point);
                }
            } elseif ($q->type === 'short') {
                if ($ans->answer_text) {
                    $key = $q->answerOptions->where('is_correct', true)->first();
                    if ($key && strtolower(trim($ans->answer_text)) === strtolower(trim($key->option_text))) {
                        $isCorrect = true; $point = $q->point;
                    }
                }
            } else {
                if ($ans->answer_option_id) {
                    $isCorrect = $ans->answerOption && $ans->answerOption->is_correct;
                    if ($isCorrect) $point = $q->point;
                }
            }

            // Update Jawaban
            $ans->update(['is_correct' => $isCorrect, 'point_earned' => $point]);

            // --- AKUMULASI SKOR KATEGORI ---
            // Gunakan strtoupper untuk antisipasi "twk" vs "TWK"
            $cat = $q->category ? strtoupper($q->category) : 'GENERAL';

            if ($cat === 'TWK') {
                $scoreTwk += $point;
            } elseif ($cat === 'TIU') {
                $scoreTiu += $point;
            } elseif ($cat === 'TKP') {
                $scoreTkp += $point;
            }

            if ($isCorrect) $correctCount++;
            $totalScore += $point;
        }

        // 3. LOGIKA KELULUSAN
        // Ambil passing grade dari paket (default 0 jika null)
        $pgTwk = $package->passing_grade_twk ?? 0;
        $pgTiu = $package->passing_grade_tiu ?? 0;
        $pgTkp = $package->passing_grade_tkp ?? 0;
        $pgTotal = $package->passing_score ?? 0;

        // Cek kelulusan per kategori (Operator >= artinya nilai SAMA DENGAN target tetap lulus)
        $passTwk = $scoreTwk >= $pgTwk;
        $passTiu = $scoreTiu >= $pgTiu;
        $passTkp = $scoreTkp >= $pgTkp;
        $passTotal = $totalScore >= $pgTotal;

        // Lulus HANYA JIKA semua syarat terpenuhi
        $isPassed = $passTwk && $passTiu && $passTkp && $passTotal;

        // Debugging: Cek file storage/logs/laravel.log jika masih penasaran kenapa tidak lulus
        Log::info("DEBUG CBT RESULT [Session: {$session->id}]", [
            'TWK' => "Skor: $scoreTwk / Target: $pgTwk -> " . ($passTwk ? 'OK' : 'FAIL'),
            'TIU' => "Skor: $scoreTiu / Target: $pgTiu -> " . ($passTiu ? 'OK' : 'FAIL'),
            'TKP' => "Skor: $scoreTkp / Target: $pgTkp -> " . ($passTkp ? 'OK' : 'FAIL'),
            'TOTAL'=> "Skor: $totalScore / Target: $pgTotal -> " . ($passTotal ? 'OK' : 'FAIL'),
            'FINAL'=> $isPassed ? 'LULUS' : 'TIDAK LULUS'
        ]);

        // Simpan Hasil
        $result = StudentTryoutResult::create([
            'cbt_session_id' => $session->id,
            'student_id' => $session->student_id,
            'question_package_id' => $session->question_package_id,
            'total_questions' => $answers->count(),
            'answered_questions' => $answeredCount,
            'correct_answers' => $correctCount,
            'wrong_answers' => $answeredCount - $correctCount,
            'total_score' => $totalScore,
            'score_twk' => $scoreTwk,
            'score_tiu' => $scoreTiu,
            'score_tkp' => $scoreTkp,
            'percentage' => 0, 
            'is_passed' => $isPassed,
            'duration_seconds' => now()->diffInSeconds($session->start_time),
        ]);

        $session->update(['end_time' => now(), 'status' => 'completed']);
        $session->student->update(['last_tryout_score' => $totalScore]);

        return $result;
    }

    public function availableTryouts(Request $request)
    {
        $student = $this->getStudentOrAbort($request);
        $studentProgramIds = $student->programs()->pluck('programs.id');

        $packages = QuestionPackage::with(['program', 'questions'])
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds)
            ->where(function($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function($q) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', now());
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pkg) use ($student) {
                $attemptsCount = StudentTryoutResult::where('student_id', $student->id)
                    ->where('question_package_id', $pkg->id)
                    ->count();

                return [
                    'id' => $pkg->id,
                    'name' => $pkg->name,
                    'program' => $pkg->program->name ?? '-',
                    'description' => $pkg->description,
                    'total_questions' => $pkg->questions->count(),
                    'duration_minutes' => $pkg->duration_minutes,
                    'passing_score' => $pkg->passing_score,
                    'max_attempts' => $pkg->max_attempts,
                    'user_attempts_count' => $attemptsCount,
                    'already_attempted' => $attemptsCount > 0,
                ];
            });

        return response()->json(['success' => true, 'data' => $packages]);
    }

    public function startSession(Request $request, $packageId)
    {
        $student = $this->getStudentOrAbort($request);
        $package = QuestionPackage::findOrFail($packageId);

        if (!$package->is_active) {
            return response()->json(['success' => false, 'message' => 'Paket tidak aktif'], 400);
        }

        $now = now(); 
        if ($package->start_date && $now < $package->start_date) {
            return response()->json(['success' => false, 'message' => 'Ujian belum dimulai.'], 403);
        }
        if ($package->end_date) {
            $deadline = \Carbon\Carbon::parse($package->end_date)->endOfDay();
            if ($now > $deadline) return response()->json(['success' => false, 'message' => 'Periode ujian berakhir.'], 403);
        }

        // Logic Resume
        $ongoingSession = CbtSession::where('student_id', $student->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            if ($ongoingSession->question_package_id == $package->id) {
                return response()->json([
                    'success' => true,
                    'message' => 'Melanjutkan sesi ujian',
                    'data' => [
                        'session_token' => $ongoingSession->session_token,
                        'session_id' => $ongoingSession->id,
                        'package' => $package,
                        'duration_minutes' => $package->duration_minutes,
                        'total_questions' => $package->questions()->count(),
                        'start_time' => $ongoingSession->start_time,
                    ]
                ]);
            } 
            return response()->json(['success' => false, 'message' => 'Ada sesi lain yang belum selesai.'], 409);
        }

        if (!is_null($package->max_attempts)) {
            $attemptCount = StudentTryoutResult::where('student_id', $student->id)
                ->where('question_package_id', $package->id)
                ->count();
            if ($attemptCount >= $package->max_attempts) return response()->json(['success' => false, 'message' => 'Kuota habis.'], 403);
        }

        DB::beginTransaction();
        try {
            $session = CbtSession::create([
                'student_id' => $student->id,
                'question_package_id' => $package->id,
                'session_token' => Str::random(64),
                'start_time' => now(),
                'status' => 'ongoing',
                'is_fullscreen' => true,
            ]);

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
                    'total_questions' => $package->questions()->count(),
                    'start_time' => $session->start_time,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getQuestions(Request $request)
    {
        $session = $request->cbt_session;
        if (!$session) return response()->json(['message' => 'Sesi tidak valid'], 401);

        $questions = $session->questionPackage->questions()
            ->with(['answerOptions']) 
            ->orderBy('order_number')
            ->get()
            ->map(function($question) {
                return [
                    'id' => $question->id,
                    'order_number' => $question->order_number,
                    'type' => $question->type,
                    'point' => $question->point,
                    'question_text' => $question->question_text,
                    'question_image' => $question->question_image,
                    'duration_seconds' => $question->duration_seconds,
                    'options' => $question->answerOptions->map(function($option) {
                        return [
                            'id' => $option->id,
                            'label' => $option->option_label,
                            'text' => $option->option_text ?? '', 
                            'image' => $option->option_image,
                        ];
                    }),
                ];
            });

        return response()->json(['success' => true, 'data' => $questions]);
    }

    public function saveAnswer(Request $request)
    {
        $session = $request->cbt_session;
        
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer_option_id' => 'nullable|exists:answer_options,id',
            'answer_text' => 'nullable|string',
            'selected_options' => 'nullable|array'
        ]);

        $answer = StudentAnswer::where('cbt_session_id', $session->id)
            ->where('question_id', $request->question_id)
            ->firstOrFail();

        $answer->update([
            'answer_option_id' => $request->answer_option_id,
            'answer_text' => $request->answer_text,
            'selected_options' => $request->selected_options,
            'answered_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function submitTryout(Request $request)
    {
        $session = $request->cbt_session;
        DB::beginTransaction();
        try {
            // [FIX] Menggunakan fungsi shared calculateResult
            $result = $this->calculateResult($session);
            
            DB::commit();
            return response()->json(['success' => true, 'data' => $result]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reviewResult(Request $request, $resultId)
    {
        $student = $this->getStudentOrAbort($request);
        
        $result = StudentTryoutResult::with([
            'questionPackage', // Load paket untuk cek passing grade
            'cbtSession.answers.question.answerOptions',
            'cbtSession.answers.answerOption',
            'cbtSession.answers.question.reports' => function($q) use ($student) {
                $q->where('student_id', $student->id);
            }
        ])
        ->where('student_id', $student->id)
        ->findOrFail($resultId);

        $formattedQuestions = $result->cbtSession->answers->map(function($answer) {
            $question = $answer->question;
            $myReport = $question->reports->first(); 

            return [
                'id' => $question->id,
                'order_number' => $question->order_number,
                'type' => $question->type,
                'category' => $question->category, // Kirim kategori ke frontend
                'point_max' => $question->point,
                'question_text' => $question->question_text,
                'question_image' => $question->question_image,
                'discussion' => $question->explanation,
                'student_answer_id' => $answer->answer_option_id,
                'answer_text' => $answer->answer_text,
                'selected_options' => $answer->selected_options,
                'point_earned' => $answer->point_earned,
                'user_report' => $myReport ? [
                    'status' => $myReport->status,
                    'content' => $myReport->report_content,
                    'response' => $myReport->admin_response,
                    'date' => $myReport->created_at->format('d M Y'),
                ] : null,
                'options' => $question->answerOptions->map(function($option) {
                    return [
                        'id' => $option->id,
                        'label' => $option->option_label,
                        'text' => $option->option_text,
                        'image' => $option->option_image,
                        'is_correct' => (bool) $option->is_correct,
                        'weight' => $option->weight,
                    ];
                })->values(),
            ];
        })->values();

        $seconds = abs($result->duration_seconds);
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;
        $durationString = $minutes . ' Menit ' . $remainingSeconds . ' Detik';

        return response()->json([
            'success' => true,
            'data' => [
                'score' => $result->total_score,
                
                // Rincian Skor
                'score_details' => [
                    'twk' => [
                        'score' => $result->score_twk,
                        'passing_grade' => $result->questionPackage->passing_grade_twk ?? 0,
                        'passed' => $result->score_twk >= ($result->questionPackage->passing_grade_twk ?? 0)
                    ],
                    'tiu' => [
                        'score' => $result->score_tiu,
                        'passing_grade' => $result->questionPackage->passing_grade_tiu ?? 0,
                        'passed' => $result->score_tiu >= ($result->questionPackage->passing_grade_tiu ?? 0)
                    ],
                    'tkp' => [
                        'score' => $result->score_tkp,
                        'passing_grade' => $result->questionPackage->passing_grade_tkp ?? 0,
                        'passed' => $result->score_tkp >= ($result->questionPackage->passing_grade_tkp ?? 0)
                    ],
                ],
                'is_passed' => $result->is_passed,

                'correct_answers_count' => $result->correct_answers,
                'total_questions' => $result->total_questions,
                'duration_taken' => $durationString,
                'questions' => $formattedQuestions
            ]
        ]);
    }

    public function reportQuestion(Request $request)
    {
        $student = $this->getStudentOrAbort($request);
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
        return response()->json(['success' => true, 'message' => 'Laporan dikirim', 'data' => $report], 201);
    }

    public function fullscreenWarning(Request $request)
    {
        $session = $request->cbt_session;
        $session->increment('warning_count');

        // Batas toleransi 2x keluar fullscreen
        if ($session->warning_count >= 2) { 
            
            DB::beginTransaction();
            try {
                // Hitung nilai sebelum return 400
                $this->calculateResult($session);
                
                DB::commit();
                
                return response()->json([
                    'success' => false, 
                    'message' => 'Batas peringatan tercapai. Jawaban dikumpulkan otomatis.', 
                    'auto_submit' => true
                ], 400);

            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
            }
        }
        
        return response()->json(['success' => true, 'message' => "Peringatan {$session->warning_count}"]);
    }
}