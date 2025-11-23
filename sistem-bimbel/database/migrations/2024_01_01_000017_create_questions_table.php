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
            
            // [TAMBAHKAN INI]
            $table->enum('type', ['single', 'multiple', 'weighted', 'short'])->default('single');
            
            $table->text('question_text');
            $table->string('question_image')->nullable();
            $table->integer('point')->default(5); // Default point
            $table->text('explanation')->nullable(); // Pembahasan (Opsional)
            
            $table->integer('order_number')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};