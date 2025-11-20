<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000017_create_questions_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_package_id')->constrained('question_packages')->onDelete('cascade');
            $table->integer('order_number'); // urutan soal, TIDAK DIACAK
            $table->text('question_text');
            $table->string('question_image')->nullable();
            $table->integer('duration_seconds')->default(120); // 2 menit
            $table->decimal('point', 8, 2)->default(5);
            $table->text('explanation')->nullable(); // pembahasan
            $table->string('explanation_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};