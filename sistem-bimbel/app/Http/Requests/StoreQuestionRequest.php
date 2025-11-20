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

    public function rules()
    {
        return [
            'question_text' => 'required|string|max:5000',
            'question_image' => 'nullable|image|max:2048',
            'duration_seconds' => 'required|integer|min:1|max:3600',
            'point' => 'required|numeric|min:0|max:100',
            'options' => 'required|array|min:2|max:5',
            'options.*.label' => 'required|in:A,B,C,D,E',
            'options.*.text' => 'required|string|max:1000',
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