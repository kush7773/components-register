import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // Build reset URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

    // Try sending via Resend
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        await resend.emails.send({
          from: 'Robomanthan <onboarding@resend.dev>',
          to: email,
          subject: 'Reset Your Robomanthan Password',
          html: `
            <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 30px; background: #0f1629; color: #e8edf5; border-radius: 16px;">
              <h2 style="margin: 0 0 8px; color: #fff;">Robomanthan</h2>
              <p style="color: #7a869a; margin: 0 0 24px;">Password Reset Request</p>
              <div style="background: #1a2236; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 24px;">
                <p style="color: #e8edf5; margin: 0 0 16px;">Hi <strong>${user.username}</strong>,</p>
                <p style="color: #7a869a; margin: 0 0 20px; font-size: 14px;">Click the button below to reset your password. This link expires in 30 minutes.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Reset Password</a>
                <p style="color: #4a5568; margin: 16px 0 0; font-size: 12px;">If you didn't request this, ignore this email.</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
        console.log(`[RESET] Email sent to ${email}`);
      } catch (emailErr) {
        console.error('[RESET] Resend email failed:', emailErr);
      }
    }

    if (!emailSent) {
      console.log(`[RESET] Mock mode — Reset link for ${email}: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Password reset link sent to your email'
        : 'Reset link generated (check server logs)',
      ...(emailSent ? {} : { resetUrl }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
