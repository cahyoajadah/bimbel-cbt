<?php
// app/Policies/QuestionPackagePolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\QuestionPackage;

class QuestionPackagePolicy
{
    public function update(User $user, QuestionPackage $package)
    {
        return $user->isQuestionMaker() && $package->created_by === $user->id;
    }

    public function delete(User $user, QuestionPackage $package)
    {
        return $user->isQuestionMaker() && $package->created_by === $user->id;
    }
}

// // Daftarkan di AuthServiceProvider
// protected $policies = [
//     QuestionPackage::class => QuestionPackagePolicy::class,
// ];

// // Gunakan di Controller
// public function update(Request $request, $id)
// {
//     $package = QuestionPackage::findOrFail($id);
//     $this->authorize('update', $package);
//     // ... update logic
// }