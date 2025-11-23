<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ubah jadi true agar bisa dipakai
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:single,multiple,weighted,short',
            'question_text' => 'required|string',
            'question_image' => 'nullable|image|max:2048',
            'point' => 'required|integer|min:0',
            'explanation' => 'nullable|string',
            
            // Validasi Opsi
            'options' => 'required|array|min:1',
            'options.*.option_text' => 'nullable|string', // Boleh null jika gambar ada
            'options.*.is_correct' => 'required', // Bisa boolean atau string "true"/"false"
            'options.*.weight' => 'nullable|integer',
        ];
    }
}