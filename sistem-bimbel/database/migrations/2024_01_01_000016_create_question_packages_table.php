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
            // Relasi ke Mata Pelajaran & Pembuat
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            
            // Data Paket
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('class_level'); // 10, 11, 12
            $table->enum('program_type', ['IPA', 'IPS', 'IPC']);
            $table->boolean('is_active')->default(true);
            
            // [BARU] Menambahkan Rentang Waktu Aktif
            $table->dateTime('start_time')->nullable(); 
            $table->dateTime('end_time')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_packages');
    }
};