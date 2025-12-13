<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('materials', function (Blueprint $table) {
        // Default false agar aman (siswa tidak bisa download kecuali diizinkan)
        $table->boolean('can_download')->default(false)->after('content');
    });
}

public function down(): void
{
    Schema::table('materials', function (Blueprint $table) {
        $table->dropColumn('can_download');
    });
}
};
