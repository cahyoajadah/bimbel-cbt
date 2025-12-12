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

        // Cek Sesi Ongoing (Resume Logic)
        $ongoingSession = CbtSession::where('student_id', $student->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            // Jika sesi yang aktif adalah paket yang sama, izinkan RESUME
            if ($ongoingSession->question_package_id == $package->id) {
                $endTime = $ongoingSession->start_time->addMinutes($package->duration_minutes);
                
                if (now()->greaterThan($endTime)) {
                    $ongoingSession->update(['status' => 'auto_submit', 'end_time' => $endTime]);
                } else {
                    return response()->json([
                        'success' => true,
                        'message' => 'Melanjutkan sesi CBT sebelumnya',
                        'data' => [
                            'session_token' => $ongoingSession->session_token,
                            'session_id' => $ongoingSession->id,
                            'package' => $package,
                            'duration_minutes' => $package->duration_minutes,
                            'total_questions' => $package->total_questions,
                            'start_time' => $ongoingSession->start_time,
                            'server_time' => now(),
                            'is_resumed' => true 
                        ]
                    ]);
                }
            } else {
                return response()->json(['success' => false, 'message' => 'Anda memiliki ujian lain yang sedang aktif.'], 409);
            }
        }

        // Cek Kuota
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

        // Buat Sesi Baru
        DB::beginTransaction();
        try {
            $session = CbtSession::create([
                'student_id' => $student->id,
                'question_package_id' => $package->id,
                'session_token' => Str::random(64),
                'start_time' => now(),
                'status' => 'ongoing',
                'is_fullscreen' => true,
                'warning_count' => 0
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
                    'server_time' => now(),
                    'is_resumed' => false
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
            ->with(['answerOptions', 'category']) 
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
                    'category' => $question->category, // Include category data
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
            'answer_option_id' => 'nullable', // Flexible validation
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

    // [FIX] PERBAIKAN LOGIKA PENILAIAN ISIAN SINGKAT
    public function submitTryout(Request $request)
    {
        $session = $request->cbt_session;
        DB::beginTransaction();
        try {
            $answers = $session->answers()
                ->with(['question.answerOptions', 'question.category', 'answerOption'])
                ->get();
            
            $totalScore = 0;
            $correctCount = 0;
            $answeredCount = 0;

            // Tracking per Kategori
            $categoryPerformance = [];

            foreach ($answers as $ans) {
                $q = $ans->question;
                $point = 0;
                $isCorrect = false;

                // Cek status terjawab
                if ($ans->answer_option_id || $ans->answer_text || !empty($ans->selected_options)) {
                    $answeredCount++;
                }

                // ----------------------------------------------------
                // LOGIKA PENILAIAN BERDASARKAN TIPE SOAL
                // ----------------------------------------------------
                
                if ($q->type === 'weighted') {
                    // Bobot Nilai (Pilih opsi dengan bobot tertinggi = benar sempurna)
                    if ($ans->answer_option_id) {
                        $selectedOpt = $q->answerOptions->where('id', $ans->answer_option_id)->first();
                        $point = $selectedOpt ? $selectedOpt->weight : 0;
                        
                        // Hitung max weight untuk menentukan apakah ini jawaban 'paling benar'
                        $maxWeight = $q->answerOptions->max('weight');
                        $isCorrect = ($point > 0 && $point == $maxWeight);
                    }

                } elseif ($q->type === 'multiple') {
                    // Pilihan Ganda Kompleks (Harus tepat semua opsi yg benar)
                    if (!empty($ans->selected_options)) {
                        $correctIds = $q->answerOptions->where('is_correct', true)->pluck('id')->toArray();
                        $studentIds = $ans->selected_options;
                        
                        $totalCorrectOptions = count($correctIds);
                        $pointPerItem = $totalCorrectOptions > 0 ? ($q->point / $totalCorrectOptions) : 0;
                        
                        $matches = count(array_intersect($studentIds, $correctIds));
                        // Penalti jika memilih yang salah (opsional, disini kita hitung parsial positif saja)
                        $point = $matches * $pointPerItem;
                        if ($point > $q->point) $point = $q->point;

                        // Dianggap benar jika poin penuh
                        $isCorrect = (abs($point - $q->point) < 0.01);
                    }

                } elseif ($q->type === 'short') {
                    // [FIX] ISIAN SINGKAT (Short Answer)
                    if ($ans->answer_text) {
                        // Ambil kunci jawaban
                        $keyOption = $q->answerOptions->where('is_correct', true)->first();
                        
                        if ($keyOption) {
                            // Sanitasi Jawaban Siswa & Kunci Jawaban
                            // 1. Hapus tag HTML (strip_tags) karena editor maker mungkin menyimpan <p>kunci</p>
                            // 2. Decode HTML entities (misal &nbsp;)
                            // 3. Trim spasi depan/belakang
                            // 4. Ubah ke lowercase
                            
                            $cleanStudentAns = strtolower(trim(strip_tags(html_entity_decode($ans->answer_text))));
                            $cleanKeyAns = strtolower(trim(strip_tags(html_entity_decode($keyOption->option_text))));

                            if ($cleanStudentAns === $cleanKeyAns) {
                                $isCorrect = true;
                                $point = $q->point;
                            }
                        }
                    }

                } else {
                    // Pilihan Ganda Biasa (Single)
                    if ($ans->answer_option_id) {
                        // Cek manual lewat relasi jika eager loading answerOption gagal
                        $selectedOpt = $ans->answerOption; 
                        if (!$selectedOpt) {
                            $selectedOpt = $q->answerOptions->where('id', $ans->answer_option_id)->first();
                        }

                        $isCorrect = $selectedOpt && $selectedOpt->is_correct;
                        if ($isCorrect) $point = $q->point;
                    }
                }
                // ----------------------------------------------------

                // Simpan hasil koreksi ke database
                $ans->update([
                    'is_correct' => $isCorrect,
                    'point_earned' => $point
                ]);

                if ($isCorrect) $correctCount++;
                $totalScore += $point;

                // Hitung Score per Kategori
                if ($q->category) {
                    $catId = $q->category->id;
                    if (!isset($categoryPerformance[$catId])) {
                        $categoryPerformance[$catId] = [
                            'id' => $catId,
                            'name' => $q->category->name,
                            'passing_grade' => $q->category->passing_grade,
                            'score_obtained' => 0,
                        ];
                    }
                    $categoryPerformance[$catId]['score_obtained'] += $point;
                }
            }

            // Hitung Kelulusan (Semua kategori harus lolos passing grade)
            $allCategoriesPassed = true;
            $formattedCategoryScores = [];

            foreach ($categoryPerformance as $catId => $data) {
                $isPassed = $data['score_obtained'] >= $data['passing_grade'];
                $data['passed'] = $isPassed;
                $formattedCategoryScores[] = $data;
                
                if (!$isPassed) {
                    $allCategoriesPassed = false;
                }
            }

            if (count($categoryPerformance) === 0) $allCategoriesPassed = true; // Fallback jika tidak ada kategori

            // Cek Passing Grade Global Paket
            $package = $session->questionPackage;
            $globalPassed = $totalScore >= $package->passing_score;

            // Final Result: Harus lulus global DAN semua kategori
            $finalPassStatus = $globalPassed && $allCategoriesPassed;

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
                'is_passed' => $finalPassStatus,
                'duration_seconds' => now()->diffInSeconds($session->start_time),
                'category_scores' => json_encode($formattedCategoryScores),
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
            'cbtSession.answers.question.category', // Load kategori
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
                'category_name' => $question->category->name ?? '-',
                'student_answer_id' => $answer->answer_option_id,
                'answer_text' => $answer->answer_text, // Jawaban teks siswa
                'selected_options' => $answer->selected_options,
                'point_earned' => $answer->point_earned,
                'is_correct' => (bool)$answer->is_correct,
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
                        'is_correct' => (bool) $option->is_correct, // Kunci Jawaban
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
                'is_passed' => $result->is_passed,
                'category_scores' => json_decode($result->category_scores),
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
        if (!$session) return response()->json(['message' => 'Invalid session'], 400);

        $session->increment('warning_count');
        
        if ($session->warning_count >= 3) {
            // Auto submit jika sudah 3 kali
            // Logic submit akan dipanggil terpisah oleh frontend, atau bisa dipicu disini
            // Disini kita hanya tandai status, submitTryout akan membereskan nilainya
            $session->update(['status' => 'auto_submit', 'end_time' => now()]);
            return response()->json(['success' => false, 'message' => 'Auto submit triggered', 'auto_submit' => true], 400);
        }
        
        return response()->json(['success' => true, 'message' => "Peringatan {$session->warning_count}"]);
    }
}