<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000019_create_cbt_sessions_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cbt_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('question_package_id')->constrained('question_packages')->onDelete('cascade');
            $table->string('session_token')->unique();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->enum('status', ['ongoing', 'completed', 'auto_submit'])->default('ongoing');
            $table->boolean('is_fullscreen')->default(true);
            $table->integer('warning_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_sessions');
    }
};
