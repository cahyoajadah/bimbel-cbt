<?php
// app/Http/Requests/StoreQuestionRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->hasRole('pembuat_soal');
    }

    public function rules(): array
    {
        return [
            'question_package_id' => 'required|exists:question_packages,id',
            'type' => 'required|in:single,multiple,weighted,short', // Validasi Tipe
            'question_text' => 'required|string',
            'question_image' => 'nullable|image|max:2048',
            'point' => 'required|integer|min:0',
            
            // Validasi Opsi Jawaban
            'options' => 'required|array|min:1',
            'options.*.option_text' => 'nullable|string',
            'options.*.option_image' => 'nullable|image|max:2048',
            'options.*.is_correct' => 'required|boolean',
            'options.*.weight' => 'nullable|integer|min:0', // Validasi Bobot
        ];
    }

    public function messages()
    {
        return [
            'question_text.required' => 'Teks soal wajib diisi',
            'options.required' => 'Minimal 2 opsi jawaban diperlukan',
        ];
    }
}