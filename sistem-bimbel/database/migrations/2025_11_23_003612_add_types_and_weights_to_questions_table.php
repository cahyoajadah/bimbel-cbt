<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update tabel 'questions' untuk mengakomodasi jenis soal
        Schema::table('questions', function (Blueprint $table) {
            // Enum: 
            // 'single' = Pilihan Ganda Biasa (Default)
            // 'multiple' = Pilihan Ganda Kompleks (Checkbox)
            // 'weighted' = Soal Bobot (TKD)
            // 'short' = Isian Singkat
            $table->enum('type', ['single', 'multiple', 'weighted', 'short'])
                  ->default('single')
                  ->after('question_image');
                  
            // Opsional: Penjelasan jawaban (jika belum ada)
            // $table->text('explanation')->nullable(); 
        });

        // 2. Update tabel 'answer_options' untuk bobot nilai
        Schema::table('answer_options', function (Blueprint $table) {
            // Bobot nilai per opsi (misal: 5, 4, 3, 0)
            // Default 0. Jika soal biasa, Benar=Bobot Soal, Salah=0
            $table->integer('weight')->default(0)->after('is_correct');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('answer_options', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};