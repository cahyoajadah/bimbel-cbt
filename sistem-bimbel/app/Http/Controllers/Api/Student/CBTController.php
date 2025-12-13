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
use Carbon\Carbon;

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

    // --- LOGIC UTAMA PENILAIAN (DINAMIS) ---
    private function calculateResult(CbtSession $session)
    {
        // Load jawaban siswa + kunci jawaban + kategori
        $answers = $session->answers()
            ->with(['question.answerOptions', 'question.category', 'answerOption'])
            ->get();
            
        // Load paket
        $package = $session->questionPackage()->with('categories')->first();

        $totalScore = 0;
        $correctCount = 0;
        $answeredCount = 0;

        // 1. Siapkan wadah nilai per Kategori
        $categoryPerformance = [];
        if ($package->categories) {
            foreach($package->categories as $cat) {
                $categoryPerformance[$cat->id] = [
                    'id' => $cat->id, 'name' => $cat->name,
                    'passing_grade' => $cat->passing_grade, 'score_obtained' => 0, 'passed' => false
                ];
            }
        }

        // 2. Loop setiap jawaban
        foreach ($answers as $ans) {
            $q = $ans->question;
            $point = 0;
            $isCorrect = false;

            // Hitung statistik soal terjawab
            if ($ans->answer_option_id || $ans->answer_text || !empty($ans->selected_options)) {
                $answeredCount++;
            }

            // ==========================================
            // LOGIKA A: PILIHAN GANDA BIASA (SINGLE)
            // ==========================================
            if ($q->type === 'single') { 
                if ($ans->answer_option_id) {
                    $selectedOpt = $q->answerOptions->where('id', $ans->answer_option_id)->first();
                    // Cek apakah opsi tersebut benar
                    $isCorrect = $selectedOpt && $selectedOpt->is_correct;
                    if ($isCorrect) $point = $q->point;
                }
            }
            
            // ==========================================
            // LOGIKA B: PILIHAN GANDA KOMPLEKS (MULTIPLE) - PARSIAL
            // ==========================================
            elseif ($q->type === 'multiple') {
                // 1. Ambil Kunci Jawaban (Array ID)
                $correctOptionIds = $q->answerOptions->where('is_correct', true)->pluck('id')->toArray();
                $totalCorrectKeys = count($correctOptionIds);
                
                // 2. Ambil Jawaban Siswa (Array ID)
                // Pastikan model StudentAnswer meng-cast 'selected_options' => 'array'
                $studentSelectedIds = $ans->selected_options ?? []; 

                if ($totalCorrectKeys > 0 && !empty($studentSelectedIds)) {
                    // Bobot per item benar = Total Poin / Jumlah Kunci
                    // Misal Poin 10, Kunci 2. Maka 1 item = 5 poin.
                    $scorePerItem = $q->point / $totalCorrectKeys;

                    // Hitung berapa yang Benar (Intersection)
                    $correctHits = count(array_intersect($studentSelectedIds, $correctOptionIds));
                    
                    // Hitung berapa yang Salah Pilih (Penalty)
                    // PENTING: Penalti wajib ada agar siswa tidak asal centang semua opsi
                    $wrongHits = count(array_diff($studentSelectedIds, $correctOptionIds));

                    // Rumus: (Benar x Bobot) - (Salah x Bobot)
                    $calculatedScore = ($correctHits * $scorePerItem) - ($wrongHits * $scorePerItem);

                    // Nilai minimal 0 (tidak boleh minus)
                    $point = max(0, $calculatedScore);

                    // Dianggap "Benar Sempurna" jika semua kunci kena & tidak ada yang salah
                    $isCorrect = ($correctHits === $totalCorrectKeys && $wrongHits === 0);
                }
            }

            // ==========================================
            // LOGIKA C: BOBOT (WEIGHTED)
            // ==========================================
            elseif ($q->type === 'weighted') {
                if ($ans->answer_option_id) {
                    $selectedOpt = $q->answerOptions->where('id', $ans->answer_option_id)->first();
                    $point = $selectedOpt ? $selectedOpt->weight : 0;
                    $isCorrect = ($point == $q->answerOptions->max('weight'));
                }
            }
            // ==========================================
            // LOGIKA D: ISIAN (SHORT)
            // ==========================================
            elseif ($q->type === 'short') {
                if ($ans->answer_text) {
                    $key = $q->answerOptions->where('is_correct', true)->first();
                    if ($key && strtolower(trim($ans->answer_text)) === strtolower(trim($key->option_text))) {
                        $isCorrect = true; 
                        $point = $q->point;
                    }
                }
            }

            // Simpan hasil ke database per butir soal
            $ans->update([
                'is_correct' => $isCorrect, 
                'point_earned' => $point // Pastikan kolom ini tipe DECIMAL/FLOAT di DB
            ]);

            $totalScore += $point;
            if ($isCorrect) $correctCount++;

            // Masukkan ke kategori
            if ($q->question_category_id && isset($categoryPerformance[$q->question_category_id])) {
                $categoryPerformance[$q->question_category_id]['score_obtained'] += $point;
            }
        }

        // ... (Sisa kode kalkulasi passing grade sama seperti sebelumnya) ...
        
        // Cek Passing Grade
        $allCategoriesPassed = true;
        foreach ($categoryPerformance as &$catData) {
            $isPassed = $catData['score_obtained'] >= $catData['passing_grade'];
            $catData['passed'] = $isPassed;
            if (!$isPassed) $allCategoriesPassed = false;
        }
        unset($catData);

        $globalPassed = $totalScore >= $package->passing_score;
        $hasCategories = count($categoryPerformance) > 0;
        $finalPassed = $hasCategories ? ($allCategoriesPassed && $globalPassed) : $globalPassed;
        $durationSeconds = now()->diffInSeconds($session->start_time);

        $result = StudentTryoutResult::create([
            'cbt_session_id' => $session->id,
            'student_id' => $session->student_id,
            'question_package_id' => $session->question_package_id,
            'total_questions' => $answers->count(),
            'answered_questions' => $answeredCount,
            'correct_answers' => $correctCount,
            'wrong_answers' => $answers->count() - $correctCount,
            'total_score' => $totalScore,
            'percentage' => 0,
            'is_passed' => $finalPassed,
            'duration_seconds' => $durationSeconds,
            'category_scores' => array_values($categoryPerformance),
        ]);

        $session->update(['end_time' => now(), 'status' => 'completed']);
        $session->student->update(['last_tryout_score' => $totalScore]);

        return $result;
    }

    // --- ENDPOINTS ---

    public function availableTryouts(Request $request)
    {
        $student = $this->getStudentOrAbort($request);
        $studentProgramIds = $student->programs()->pluck('programs.id');
        $now = now();

        $packages = QuestionPackage::with(['program', 'questions', 'categories']) // [FIX] Load categories
            ->where('is_active', true)
            ->whereIn('program_id', $studentProgramIds)
            ->where(function($query) use ($now) {
                $query->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function($query) use ($now) {
                $query->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pkg) use ($student) {
                $attempts = StudentTryoutResult::where('student_id', $student->id)
                    ->where('question_package_id', $pkg->id)
                    ->count();

                $ongoingSession = CbtSession::where('student_id', $student->id)
                    ->where('question_package_id', $pkg->id)
                    ->where('status', 'ongoing')
                    ->exists();

                return [
                    'id' => $pkg->id,
                    'name' => $pkg->name,
                    // [FIX] Kirim Program sebagai Object (Safe)
                    'program' => $pkg->program ? [
                        'id' => $pkg->program->id,
                        'name' => $pkg->program->name
                    ] : null,
                    // [FIX] Kirim daftar kategori
                    'categories' => $pkg->categories->map(fn($c) => $c->name),
                    
                    'description' => $pkg->description,
                    'total_questions' => $pkg->questions->count(),
                    'duration_minutes' => $pkg->duration_minutes,
                    'execution_mode' => $pkg->execution_mode, // Info Mode
                    'start_date' => $pkg->start_date ? $pkg->start_date->toIso8601String() : null,
                    'end_date' => $pkg->end_date ? $pkg->end_date->toIso8601String() : null,
                    'user_attempts_count' => $attempts,
                    'max_attempts' => $pkg->max_attempts,
                    'has_ongoing_session' => $ongoingSession,
                    'is_limit_reached' => !is_null($pkg->max_attempts) && $attempts >= $pkg->max_attempts
                ];
            });

        return response()->json(['success' => true, 'data' => $packages]);
    }

    public function startSession(Request $request, $packageId)
    {
        $student = $this->getStudentOrAbort($request);
        $package = QuestionPackage::findOrFail($packageId);
        $now = now(); // Waktu Server Saat Ini

        // 1. Validasi Status Aktif
        if (!$package->is_active) {
            return response()->json(['message' => 'Paket soal ini sedang tidak aktif.'], 403);
        }

        // 2. [LOGIC BARU] Validasi Waktu Berdasarkan Mode
        if ($package->execution_mode === 'live') {
            // MODE LIVE: Waktu ketat (Serentak)
            if ($package->start_date && $now->lt($package->start_date)) {
                return response()->json(['message' => 'Ujian Live belum dimulai. Jadwal: ' . $package->start_date->format('d M Y H:i')], 403);
            }
            if ($package->end_date && $now->gt($package->end_date)) {
                return response()->json(['message' => 'Ujian Live telah berakhir.'], 403);
            }
        } else {
            // MODE FLEXIBLE: Waktu longgar (Availability Window)
            if ($package->start_date && $now->lt($package->start_date)) {
                return response()->json(['message' => 'Ujian belum dibuka.'], 403);
            }
            if ($package->end_date && $now->gt($package->end_date->endOfDay())) {
                return response()->json(['message' => 'Periode ujian sudah berakhir.'], 403);
            }
        }

        // 3. Cek Sesi Berjalan (Resume)
        $ongoingSession = CbtSession::where('student_id', $student->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingSession) {
            if ($ongoingSession->question_package_id == $package->id) {
                return response()->json([
                    'success' => true,
                    'message' => 'Melanjutkan sesi...',
                    'data' => [
                        'session_id' => $ongoingSession->id,
                        'session_token' => $ongoingSession->session_token,
                    ]
                ]);
            } else {
                return response()->json(['message' => 'Selesaikan ujian yang sedang aktif terlebih dahulu.'], 409);
            }
        }

        // 4. Validasi Kuota (Live biasanya cuma 1x)
        $attemptCount = StudentTryoutResult::where('student_id', $student->id)
            ->where('question_package_id', $package->id)
            ->count();
        
        $limit = $package->execution_mode === 'live' ? 1 : $package->max_attempts; // Live max 1x
        
        if (!is_null($limit) && $attemptCount >= $limit) {
            return response()->json(['message' => 'Kesempatan mengerjakan sudah habis.'], 403);
        }

        // 5. Buat Sesi Baru
        DB::beginTransaction();
        try {
            $session = CbtSession::create([
                'student_id' => $student->id,
                'question_package_id' => $package->id,
                'session_token' => Str::random(64),
                'start_time' => $package->execution_mode === 'live' ? $now : null,
                'status' => 'ongoing',
                'is_fullscreen' => true,
            ]);

            $questions = $package->questions()->orderBy('order_number')->get();
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

        $package = $session->questionPackage;
        $now = now();

        // --- HITUNG SISA WAKTU (SERVER SIDE AUTHORITY) ---
        $remainingSeconds = 0;

        if ($package->execution_mode === 'live') {
            // MODE LIVE: Hitung selisih (Waktu Selesai Paket - Waktu Sekarang)
            // Jadi jika siswa telat, waktu otomatis lebih sedikit.
            if ($package->end_date) {
                $endTime = $package->end_date;
                $remainingSeconds = $now->diffInSeconds($endTime, false); // false = return negatif jika lewat
            } else {
                // Fallback jika admin lupa set end_date di mode live (seharusnya tidak terjadi karena validasi)
                $remainingSeconds = 0;
            }
        } else {
            // MODE FLEXIBLE
            if (!$session->start_time) {
                // [BARU] Jika start_time masih NULL, berarti belum mulai. Kirim durasi penuh.
                $remainingSeconds = $package->duration_minutes * 60;
            } else {
                // Jika sudah ada start_time, hitung sisa waktunya
                // Perhatikan: start_time di model harus sudah di-cast ke Carbon/Datetime
                $startTime = $session->start_time; 
                // Jika start_time string, parse dulu: Carbon::parse($session->start_time)
                
                $finishTime = $startTime->copy()->addMinutes($package->duration_minutes);
                $remainingSeconds = $now->diffInSeconds($finishTime, false);
            }
        }

        // Jika waktu minus (sudah lewat), set ke 0
        $remainingSeconds = max(0, (int)$remainingSeconds);

        // Jika waktu habis, bisa trigger auto-submit atau kirim sinyal timeout
        if ($remainingSeconds <= 0) {
             // Opsional: Lakukan submit otomatis disini
             return response()->json([
                 'success' => false, 
                 'code' => 'SESSION_TIMEOUT',
                 'message' => 'Waktu ujian telah berakhir.'
             ], 408);
        }

        // ... (kode ambil questions sama seperti sebelumnya) ...
        $questions = $package->questions()
            ->with(['answerOptions', 'category'])
            ->orderBy('order_number')
            ->get()
            ->map(function($q) {
                return [
                    'id' => $q->id,
                    'order_number' => $q->order_number,
                    'type' => $q->type,
                    'point' => $q->point,
                    'question_text' => $q->question_text,
                    'question_image' => $q->question_image,
                    'category_name' => $q->category->name ?? 'Umum',
                    'options' => $q->answerOptions->map(function($opt) {
                        return [
                            'id' => $opt->id,
                            'label' => $opt->option_label,
                            'text' => $opt->option_text,
                            'image' => $opt->option_image
                        ];
                    }),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $questions,
            'session' => [
                'id' => $session->id,
                'remaining_seconds' => $remainingSeconds, // Frontend tinggal hitung mundur dari ini
                'execution_mode' => $package->execution_mode,
                'server_time' => $now->toIso8601String()
            ]
        ]);
    }

    public function saveAnswer(Request $request)
    {
        $session = $request->cbt_session;
        
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            // Validasi longgar karena jawaban bisa null (dikosongkan)
            'answer_option_id' => 'nullable',
            'answer_text' => 'nullable',
            'selected_options' => 'nullable|array'
        ]);

        $answer = StudentAnswer::where('cbt_session_id', $session->id)
            ->where('question_id', $request->question_id)
            ->firstOrFail();

        $answer->update([
            'answer_option_id' => $request->answer_option_id,
            'answer_text' => $request->answer_text,
            'selected_options' => $request->selected_options, // Pastikan model StudentAnswer cast 'selected_options' => 'array'
            'answered_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function submitTryout(Request $request)
    {
        $session = $request->cbt_session;
        
        // Cek jika sesi sudah selesai (misal ketutup middleware atau double click)
        if ($session->status === 'completed') {
            // Cek apakah Hasil Nilai (StudentTryoutResult) sudah ada?
            $existingResult = StudentTryoutResult::where('cbt_session_id', $session->id)->first();
            
            if ($existingResult) {
                // KASUS A: Nilai sudah ada, kembalikan datanya agar frontend bisa redirect ke Review
                return response()->json(['success' => true, 'data' => $existingResult]);
            } else {
                // KASUS B: Status completed (misal kena timeout middleware) tapi Nilai BELUM dihitung.
                // Maka KITA HITUNG SEKARANG.
                // Lanjut ke logika DB::beginTransaction di bawah...
            }
        }

        DB::beginTransaction();
        try {
            // Hitung nilai (Function ini akan update status jadi completed & create result)
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
            'questionPackage', 
            'cbtSession.answers.question.answerOptions',
            'cbtSession.answers.answerOption',
            'cbtSession.answers.question.category'
        ])
        ->where('student_id', $student->id)
        ->findOrFail($resultId);

        $formattedQuestions = $result->cbtSession->answers->map(function($answer) {
            $question = $answer->question;
            return [
                'id' => $question->id,
                'order_number' => $question->order_number,
                'question_text' => $question->question_text,
                'category_name' => $question->category->name ?? '-',
                'type' => $question->type,
                'student_answer_id' => $answer->answer_option_id,
                'student_text_answer' => $answer->answer_text,
                'student_selected_options' => $answer->selected_options,
                'point_earned' => $answer->point_earned,
                'is_correct' => (bool) $answer->is_correct,
                'discussion' => $question->explanation,
                'options' => $question->answerOptions->map(function($option) {
                    return [
                        'id' => $option->id,
                        'label' => $option->option_label,
                        'text' => $option->option_text,
                        'is_correct' => (bool) $option->is_correct,
                        'weight' => $option->weight, // Tampilkan bobot untuk review
                    ];
                })->values(),
            ];
        })->values();

        // Helper durasi string
        $seconds = abs($result->duration_seconds);
        $durationString = floor($seconds / 60) . ' Menit ' . ($seconds % 60) . ' Detik';

        return response()->json([
            'success' => true,
            'data' => [
                'score' => $result->total_score,
                'is_passed' => $result->is_passed,
                'category_scores' => $result->category_scores, // Array JSON
                'correct_answers_count' => $result->correct_answers,
                'total_questions' => $result->total_questions,
                'duration_taken' => $durationString,
                'questions' => $formattedQuestions
            ]
        ]);
    }

    public function startTimer(Request $request)
    {
        $session = $request->cbt_session; // Dari Middleware
        
        // Hanya update jika start_time masih kosong (mencegah reset waktu saat refresh)
        if (is_null($session->start_time)) {
            $session->update([
                'start_time' => now()
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function fullscreenWarning(Request $request)
    {
        $session = $request->cbt_session;
        if (!$session) return response()->json(['message' => 'Invalid session'], 400);

        $session->increment('warning_count');
        
        // Contoh: Auto submit jika lebih dari 3 kali peringatan (Opsional)
        if ($session->warning_count > 3) {
             // $this->calculateResult($session); // Uncomment jika ingin auto-submit
             // return response()->json(['force_submit' => true]);
        }

        return response()->json(['success' => true, 'message' => "Peringatan ke-{$session->warning_count}"]);
    }
    
    public function reportQuestion(Request $request)
    {
        $student = $this->getStudentOrAbort($request);
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'report_content' => 'required|string',
        ]);

        QuestionReport::create([
            'question_id' => $request->question_id,
            'student_id' => $student->id,
            'report_content' => $request->report_content,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Laporan berhasil dikirim']);
    }
}