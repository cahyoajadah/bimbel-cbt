<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Tabel Kategori Soal (terhubung ke Paket Soal)
        Schema::create('question_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_package_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // Contoh: "Matematika Dasar", "Logika"
            $table->double('passing_grade')->default(0); // Nilai ambang batas per kategori
            $table->timestamps();
        });

        // 2. Update Tabel Questions (Setiap soal punya kategori)
        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('question_category_id')->nullable()->constrained('question_categories')->nullOnDelete();
        });

        // 3. Update Tabel Hasil Tryout (Menyimpan breakdown nilai per kategori)
        Schema::table('student_tryout_results', function (Blueprint $table) {
            $table->json('category_scores')->nullable(); // Menyimpan snapshot: [{"name": "Math", "score": 50, "passed": true}]
        });
    }

    public function down()
    {
        Schema::table('student_tryout_results', function (Blueprint $table) {
            $table->dropColumn('category_scores');
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['question_category_id']);
            $table->dropColumn('question_category_id');
        });
        Schema::dropIfExists('question_categories');
    }
};