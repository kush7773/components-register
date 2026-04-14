import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, email: true, phoneNumber: true, role: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, phoneNumber, currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updates: any = {};

    if (email !== undefined) {
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
      }
      updates.email = email || null;
    }

    if (phoneNumber !== undefined) {
      if (phoneNumber) {
        const existing = await prisma.user.findUnique({ where: { phoneNumber } });
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 });
        }
      }
      updates.phoneNumber = phoneNumber || null;
    }

    if (newPassword && currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
