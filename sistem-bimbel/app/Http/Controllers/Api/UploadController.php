<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
    public function uploadImage(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        if ($request->hasFile('image')) {
            try {
                // [PERBAIKAN] 
                // Simpan langsung ke 'questions' di disk 'public'
                // Hasilnya: storage/app/public/questions/namafilehash.jpg
                $path = $request->file('image')->store('questions', 'public');
                
                // Dapatkan URL publik (/storage/questions/namafilehash.jpg)
                $url = Storage::url($path);

                return response()->json([
                    'success' => true,
                    // asset() memastikan domain localhost:8000 atau production disertakan
                    'url' => asset($url) 
                ]);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Gagal menyimpan file: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'Tidak ada file yang diupload'], 400);
    }
}