<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000016_create_question_packages_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(120); // Durasi pengerjaan
            $table->integer('passing_score')->default(0);
            $table->integer('max_attempts')->nullable();
            
            // Durasi Tanggal Aktif
            $table->dateTime('start_date')->nullable(); 
            $table->dateTime('end_date')->nullable();
            $table->enum('execution_mode', ['flexible', 'live'])->default('flexible');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_packages');
    }
};