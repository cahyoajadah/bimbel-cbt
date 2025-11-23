<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000018_create_answer_options_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->char('option_label', 1)->nullable(); // A, B, C, D, E
            $table->text('option_text')->nullable();
            $table->string('option_image')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->integer('weight')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_options');
    }
};