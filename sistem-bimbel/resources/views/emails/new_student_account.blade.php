<!DOCTYPE html>
<html>
<head><title>Selamat Datang</title></head>
<body>
    <h2>Halo, {{ $user->name }}!</h2>
    <p>Akun Anda telah dibuat. Silakan login dengan detail berikut:</p>
    <p><strong>Email:</strong> {{ $user->email }}</p>
    <p><strong>Password:</strong> {{ $password }}</p>
    <p>Segera ganti password Anda setelah login.</p>
</body>
</html>