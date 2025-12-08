<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// ============================================
// 2024_01_01_000023_create_landing_contents_table.php
// ============================================
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_contents', function (Blueprint $table) {
            $table->id();
            $table->enum('section', ['program', 'testimony', 'feature', 'faq', 'blog', 'gallery']);
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('image')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_contents');
    }
};