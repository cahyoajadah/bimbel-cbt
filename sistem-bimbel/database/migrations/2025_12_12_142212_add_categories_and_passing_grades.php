<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add Category to Questions Table
        Schema::table('questions', function (Blueprint $table) {
            // 'General' is default to keep existing questions valid
            $table->enum('category', ['TWK', 'TIU', 'TKP', 'General'])->default('General')->after('type');
        });

        // 2. Add Passing Grades to Question Packages Table
        Schema::table('question_packages', function (Blueprint $table) {
            $table->integer('passing_grade_twk')->default(0)->after('passing_score');
            $table->integer('passing_grade_tiu')->default(0)->after('passing_grade_twk');
            $table->integer('passing_grade_tkp')->default(0)->after('passing_grade_tiu');
        });

        // 3. Add Score Breakdown to Student Results Table
        Schema::table('student_tryout_results', function (Blueprint $table) {
            $table->integer('score_twk')->default(0)->after('total_score');
            $table->integer('score_tiu')->default(0)->after('score_twk');
            $table->integer('score_tkp')->default(0)->after('score_tiu');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('category');
        });
        Schema::table('question_packages', function (Blueprint $table) {
            $table->dropColumn(['passing_grade_twk', 'passing_grade_tiu', 'passing_grade_tkp']);
        });
        Schema::table('student_tryout_results', function (Blueprint $table) {
            $table->dropColumn(['score_twk', 'score_tiu', 'score_tkp']);
        });
    }
};