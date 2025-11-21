<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;
use Illuminate\Support\Facades\Validator;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::query();
        
        // Filter pencarian jika ada
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $subjects = $query->orderBy('name')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $subjects
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:subjects,name',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject = Subject::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil dibuat',
            'data' => $subject
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:subjects,name,' . $id,
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil diperbarui',
            'data' => $subject
        ]);
    }

    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil dihapus'
        ]);
    }
}
