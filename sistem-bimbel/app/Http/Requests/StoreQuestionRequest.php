<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // [FIX] Method ini penting agar parameter dari URL (packageId)
    // digabung ke dalam data request sebelum validasi berjalan.
    protected function prepareForValidation()
    {
        // Ambil 'packageId' dari route (URL) dan masukkan sebagai 'question_package_id'
        if ($this->route('packageId')) {
            $this->merge([
                'question_package_id' => $this->route('packageId'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'question_package_id' => 'required|exists:question_packages,id',
            'question_category_id' => 'required|exists:question_categories,id',
            'type' => 'required|in:single,multiple,short,weighted', // Sesuaikan dengan enum frontend
            'question_text' => 'required|string',
            'question_image' => 'nullable|image|max:2048',
            'point' => 'required|numeric|min:0',
            
            'options' => 'nullable|array',
            'options.*.label' => 'nullable|string',
            'options.*.text' => 'nullable|string',
            'options.*.is_correct' => 'nullable|boolean',
            'options.*.weight' => 'nullable|numeric',
        ];
    }
}