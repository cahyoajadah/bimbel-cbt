<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000009_create_subjects_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            
            // Data Utama
            $table->string('name');
            $table->string('code')->unique()->nullable(); 
            $table->text('description')->nullable();
            
            // Relasi ke Program (PENTING: Pastikan ini ada di sini)
            $table->foreignId('program_id')
                  ->nullable()
                  ->constrained('programs')
                  ->onDelete('set null');
            
            // Status Aktif (PENTING: Tambahkan ini agar tidak error 'column not found')
            $table->boolean('is_active')->default(true); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};