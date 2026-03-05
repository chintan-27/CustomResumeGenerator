"""
Email utilities using Resend.
Set RESEND_API_KEY and RESEND_FROM_EMAIL in your environment.
"""
import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@resumeai.app")
APP_URL = os.getenv("NEXTAUTH_URL", "http://localhost:3000")


def send_password_reset(to_email: str, reset_token: str) -> bool:
    """Send a password reset link."""
    reset_url = f"{APP_URL}/reset-password?token={reset_token}"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": "Reset your ResumeAI password",
            "html": f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a">
  <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Reset your password</h1>
  <p style="color:#6b7280;margin-bottom:24px">Click the button below to reset your password. This link expires in 1 hour.</p>
  <a href="{reset_url}"
     style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">
    Reset Password
  </a>
  <p style="color:#9ca3af;font-size:12px;margin-top:32px">
    If you didn't request this, ignore this email. Your password won't change.
  </p>
</div>
""",
        })
        return True
    except Exception as e:
        print(f"[email] Failed to send reset email: {e}")
        return False


def send_verification_email(to_email: str, verify_token: str) -> bool:
    """Send an email verification link."""
    verify_url = f"{APP_URL}/verify-email?token={verify_token}"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": "Verify your ResumeAI email",
            "html": f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#1a1a1a">
  <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Verify your email</h1>
  <p style="color:#6b7280;margin-bottom:24px">Click the button below to verify your email address.</p>
  <a href="{verify_url}"
     style="display:inline-block;background:#2d6a4f;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">
    Verify Email
  </a>
  <p style="color:#9ca3af;font-size:12px;margin-top:32px">
    If you didn't create a ResumeAI account, ignore this email.
  </p>
</div>
""",
        })
        return True
    except Exception as e:
        print(f"[email] Failed to send verification email: {e}")
        return False
