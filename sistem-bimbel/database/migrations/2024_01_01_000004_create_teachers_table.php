<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            // HAPUS: $table->foreignId('user_id')...
            
            // TAMBAH: Data diri langsung di sini
            $table->string('name');
            $table->string('email')->nullable(); // Email kontak saja, bukan login
            $table->string('phone')->nullable();
            
            $table->string('specialization')->nullable();
            $table->string('education')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
