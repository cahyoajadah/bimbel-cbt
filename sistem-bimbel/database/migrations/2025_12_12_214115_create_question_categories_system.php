<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Buat Tabel Kategori (Dinamis, bisa isi apa saja: Matematika, B.Inggris, dll)
        Schema::create('question_categories', function (Blueprint $table) {
            $table->id();
            // Setiap kategori menempel pada satu Paket Soal
            $table->foreignId('question_package_id')->constrained('question_packages')->onDelete('cascade');
            $table->string('name'); // Contoh: "Logika", "Sejarah"
            $table->integer('passing_grade')->default(0); // Ambang batas nilai per kategori
            $table->timestamps();
        });

        // 2. Tambahkan kolom relasi di tabel Soal
        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('question_category_id')
                  ->nullable()
                  ->after('question_package_id')
                  ->constrained('question_categories')
                  ->onDelete('set null'); // Jika kategori dihapus, soal jangan ikut terhapus (jadi null)
        });
        
        // 3. Update tabel Hasil Ujian untuk menyimpan detail nilai per kategori
        Schema::table('student_tryout_results', function (Blueprint $table) {
            // Kolom JSON untuk menyimpan snapshot nilai kategori saat ujian selesai
            // Contoh isi: [{"name": "TIU", "score": 80, "passed": true}, ...]
            $table->json('category_scores')->nullable()->after('total_score');
        });
    }

    public function down()
    {
        // Urutan rollback harus dibalik (hapus foreign key dulu)
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