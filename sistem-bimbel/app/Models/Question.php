<?php
// ============================================
// app/Models/Question.php
// ============================================
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Question extends Model
{  
    protected $fillable = [
        'question_package_id',
        'question_text',
        'question_image', // Pastikan kolom ini ada di migration jika digunakan
        'order_number',
        'type',         
        'explanation',  
        'point'
    ];

    protected $casts = ['point' => 'decimal:2'];

    /**
     * The "booted" method of the model.
     * Logika otomatis berjalan saat soal akan dihapus.
     */
    protected static function booted()
    {
        static::deleting(function ($question) {
            // 1. Hapus Gambar Utama Soal (Jika ada kolom question_image)
            if (!empty($question->question_image)) {
                self::deleteFileFromUrl($question->question_image);
            }

            // 2. Hapus Gambar yang tertanam (Embedded) di dalam Teks Soal (HTML)
            self::deleteEmbeddedImages($question->question_text);
            self::deleteEmbeddedImages($question->explanation);

            // 3. Hapus Gambar pada Opsi Jawaban (Looping manual karena cascade DB tidak trigger event model option)
            // Kita load opsi jawaban terkait
            foreach ($question->answerOptions as $option) {
                // Hapus gambar di kolom option_image (jika ada)
                if (!empty($option->option_image)) {
                    self::deleteFileFromUrl($option->option_image);
                }
                // Hapus gambar embedded di teks opsi
                self::deleteEmbeddedImages($option->option_text);
            }
        });
    }

    /**
     * Helper: Hapus file fisik berdasarkan URL public
     */
    protected static function deleteFileFromUrl($url)
    {
        if (empty($url)) return;

        // Contoh URL: http://localhost:8000/storage/questions/abc.jpg
        // Kita butuh path relatif: questions/abc.jpg
        
        $path = parse_url($url, PHP_URL_PATH); // Mengambil /storage/questions/abc.jpg
        
        // Cek apakah URL mengarah ke folder storage kita
        if ($path && strpos($path, '/storage/') === 0) {
            // Hapus prefix '/storage/' (panjang 9 karakter)
            $relativePath = substr($path, 9); 
            
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }

    /**
     * Helper: Cari tag <img> dalam HTML dan hapus filenya
     */
    protected static function deleteEmbeddedImages($htmlContent)
    {
        if (empty($htmlContent)) return;

        // Gunakan DOMDocument untuk parsing HTML dengan aman
        $dom = new \DOMDocument();
        
        // Suppress warning untuk format HTML fragment
        libxml_use_internal_errors(true);
        
        // Load HTML (tambahkan wrapper utf-8 agar karakter khusus aman)
        $dom->loadHTML(mb_convert_encoding($htmlContent, 'HTML-ENTITIES', 'UTF-8'), LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        
        libxml_clear_errors();

        $images = $dom->getElementsByTagName('img');
        
        foreach ($images as $img) {
            $src = $img->getAttribute('src');
            self::deleteFileFromUrl($src);
        }
    }

    // --- RELATIONSHIPS ---

    public function questionPackage(): BelongsTo
    {
        return $this->belongsTo(QuestionPackage::class);
    }

    public function answerOptions(): HasMany
    {
        return $this->hasMany(AnswerOption::class);
    }

    public function correctOption(): HasMany
    {
        return $this->hasMany(AnswerOption::class)->where('is_correct', true);
    }

    public function studentAnswers(): HasMany
    {
        return $this->hasMany(StudentAnswer::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(QuestionReport::class);
    }
}