<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_session_id')->constrained('cbt_sessions')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            
            // Opsi Jawaban Single/Weighted
            $table->foreignId('answer_option_id')->nullable()->constrained('answer_options')->onDelete('set null');
            
            // [BARU] Kolom tambahan untuk jenis soal baru
            $table->text('answer_text')->nullable();       // Untuk jawaban Isian Singkat
            $table->json('selected_options')->nullable();  // Untuk jawaban Multiple (Checkbox)
            
            $table->boolean('is_correct')->nullable();
            $table->decimal('point_earned', 8, 2)->default(0);
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_answers');
    }
};