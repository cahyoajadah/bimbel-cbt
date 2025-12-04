<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewStudentAccount extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $password; // Variabel public agar bisa dibaca di View

    // Pastikan constructor menerima $password
    public function __construct(User $user, $password)
    {
        $this->user = $user;
        $this->password = $password; // Simpan ke property class
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Selamat Datang! Ini Detail Akun Bimbel Anda',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new_student_account', // Pastikan view ini ada
        );
    }
}