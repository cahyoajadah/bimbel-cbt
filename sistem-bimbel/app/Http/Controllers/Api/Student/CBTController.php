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
use Illuminate\Support\Str;

class CBTController extends Controller
{
    // [FIX] Helper function untuk cek siswa
    private function getStudentOrAbort(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            abort(response()->json(['message' => 'Akun ini bukan akun siswa yang valid'], 403));
        }
        return $student;
    }

    public function availableTryouts(Request $request)
    {
        $student = $this->getStudentOrAbort($request);

        $studentProgramIds = $student->programs()->pluck('programs.id');

        $packages = QuestionPackage::with(['program', 'questions'])
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds)
            
            // Filter 1: Start Date (Sudah mulai atau Null)
            ->where(function($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            
            // Filter 2: End Date (Belum berakhir atau Null)
            // Menggunakan whereDate >= now() agar paket yang berakhir HARI INI masih muncul sampai jam 23:59
            ->where(function($q) {
                $q->whereNull('end_date')
                  ->orWhereDate('end_date', '>=', now());
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

        // 1. Cek Aktif Manual
        if (!$package->is_active) {
            return response()->json(['success' => false, 'message' => 'Paket tidak aktif'], 400);
        }

        // Validasi Waktu Server (Anti Manipulasi Jam Laptop)
        $now = now(); 

        // Cek Tanggal Mulai
        if ($package->start_date && $now < $package->start_date) {
            return response()->json([
                'success' => false, 
                'message' => 'Ujian belum dimulai. Silakan cek jadwal.'
            ], 403);
        }

        // Cek Tanggal Selesai (di set batas sampai jam 23:59:59 hari tersebut)
        if ($package->end_date) {
            $deadline = \Carbon\Carbon::parse($package->end_date)->endOfDay();
            if ($now > $deadline) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Periode ujian telah berakhir.'
                ], 403);
            }
        }

        // 2. Cek Kuota Pengerjaan
        if (!is_null($package->max_attempts)) {
            $attemptCount = StudentTryoutResult::where('student_id', $student->id)
                ->where('question_package_id', $package->id)
                ->count();

            if ($attemptCount >= $package->max_attempts) {
                return response()->json([
                    'success' => false, 
                    'message' => "Kuota pengerjaan habis. Batas maksimal: {$package->max_attempts} kali."
                ], 403);
            }
        }

        $ongoingSession = CbtSession::where('student_id', $student->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            return response()->json(['success' => false, 'message' => 'Masih ada sesi aktif'], 409);
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
                    'total_questions' => $package->total_questions,
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

        // [FIX] Pastikan relation answerOptions diload
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
                            // [FIX] Pastikan field text selalu terisi untuk menghindari null di frontend
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
            $answers = $session->answers()->with(['question.answerOptions', 'answerOption'])->get();
            
            $totalScore = 0;
            $correctCount = 0;
            $answeredCount = 0;

            foreach ($answers as $ans) {
                $q = $ans->question;
                $point = 0;
                $isCorrect = false;

                if ($ans->answer_option_id || $ans->answer_text || !empty($ans->selected_options)) {
                    $answeredCount++;
                }

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
                            $isCorrect = true;
                            $point = $q->point;
                        }
                    }
                } else {
                    if ($ans->answer_option_id) {
                        $isCorrect = $ans->answerOption && $ans->answerOption->is_correct;
                        if ($isCorrect) $point = $q->point;
                    }
                }

                $ans->update([
                    'is_correct' => $isCorrect,
                    'point_earned' => $point
                ]);

                if ($isCorrect) $correctCount++;
                $totalScore += $point;
            }

            $result = StudentTryoutResult::create([
                'cbt_session_id' => $session->id,
                'student_id' => $session->student_id,
                'question_package_id' => $session->question_package_id,
                'total_questions' => $answers->count(),
                'answered_questions' => $answeredCount,
                'correct_answers' => $correctCount,
                'wrong_answers' => $answeredCount - $correctCount,
                'total_score' => $totalScore,
                'percentage' => 0,
                'is_passed' => false,
                'duration_seconds' => now()->diffInSeconds($session->start_time),
            ]);

            $session->update(['end_time' => now(), 'status' => 'completed']);
            $session->student->update(['last_tryout_score' => $totalScore]);

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
        if ($session->warning_count >= 3) {
            $session->update(['status' => 'auto_submit', 'end_time' => now()]);
            return response()->json(['success' => false, 'message' => 'Auto submit', 'auto_submit' => true], 400);
        }
        return response()->json(['success' => true, 'message' => "Peringatan {$session->warning_count}"]);
    }
}