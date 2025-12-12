<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000021_create_student_tryout_results_table.php
// ============================================
return new class extends Migration
{
    // database/migrations/xxxx_xx_xx_xxxxxx_create_student_tryout_results_table.php

    public function up()
    {
        Schema::create('student_tryout_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_package_id')->constrained()->onDelete('cascade');
            
            $table->integer('total_questions');
            $table->integer('answered_questions');
            $table->integer('correct_answers');
            $table->integer('wrong_answers');
            
            $table->decimal('total_score', 8, 2);
            $table->decimal('percentage', 5, 2);
            $table->boolean('is_passed')->default(false);
            $table->integer('duration_seconds')->nullable(); // Untuk durasi pengerjaan
            
            // [PENTING] Kolom ini wajib ada untuk fitur detail nilai
            $table->json('category_scores')->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_tryout_results');
    }
};