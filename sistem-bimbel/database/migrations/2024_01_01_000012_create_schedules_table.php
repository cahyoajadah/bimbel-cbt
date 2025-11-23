<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000012_create_schedules_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['tryout', 'class']); 
            $table->enum('class_type', ['zoom', 'offline'])->nullable(); 
            
            // Relasi yang sudah ada
            $table->foreignId('program_id')->nullable()->constrained('programs')->onDelete('set null');
            
            // [BARU] Tambahkan Subject ID di sini
            // Kita set nullable dulu agar aman, tapi nanti di validasi controller tetap required
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->onDelete('cascade');
            
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->foreignId('package_id')->nullable()->constrained('packages')->onDelete('set null');
            
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('zoom_link')->nullable();
            $table->text('location')->nullable(); 
            $table->integer('max_participants')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};