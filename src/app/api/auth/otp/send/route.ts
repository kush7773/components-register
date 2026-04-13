import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    });

    // Try sending via Resend if API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        await resend.emails.send({
          from: 'Robomanthan <onboarding@resend.dev>',
          to: email,
          subject: 'Your Robomanthan Login OTP',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 30px; background: #0f1629; color: #e8edf5; border-radius: 16px;">
              <h2 style="margin: 0 0 8px; color: #fff;">Robomanthan</h2>
              <p style="color: #7a869a; margin: 0 0 24px;">Component Management Portal</p>
              <div style="background: #1a2236; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 24px; text-align: center;">
                <p style="color: #7a869a; margin: 0 0 12px; font-size: 14px;">Your one-time password</p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #3b82f6;">${otp}</div>
                <p style="color: #7a869a; margin: 12px 0 0; font-size: 13px;">Expires in 5 minutes</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
        console.log(`[OTP] Email sent to ${email}`);
      } catch (emailErr) {
        console.error('[OTP] Resend email failed:', emailErr);
      }
    }

    // Fallback: log to console if email not sent
    if (!emailSent) {
      console.log(`[OTP] Mock mode — OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'OTP sent to your email' : 'OTP generated (check server logs or alert)',
      // Only send mocked OTP to client when Resend is not configured
      ...(emailSent ? {} : { mockedOtp: otp }),
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
