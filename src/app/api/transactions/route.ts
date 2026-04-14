import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let whereClause = {};
    if (session.role === 'EMPLOYEE') {
      whereClause = { userId: session.userId };
    } else if (session.role === 'ADMIN' && userId) {
      whereClause = { userId: parseInt(userId) };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { component: true, user: true },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { componentId, action, quantity } = await req.json();
    const qty = parseInt(quantity);

    if (action !== 'BORROW' && action !== 'RETURN' && action !== 'LOST') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const component = await tx.component.findUnique({ where: { id: componentId } });
      if (!component) throw new Error('Component not found');

      if (action === 'BORROW') {
        if (component.availableQuantity < qty) {
          throw new Error('Not enough available quantity');
        }
        await tx.component.update({
          where: { id: componentId },
          data: { availableQuantity: component.availableQuantity - qty },
        });
      } else if (action === 'RETURN') {
        await tx.component.update({
          where: { id: componentId },
          data: { availableQuantity: component.availableQuantity + qty },
        });
      } else if (action === 'LOST') {
        // Lost components permanently reduce both available and total quantities
        await tx.component.update({
          where: { id: componentId },
          data: { 
            totalQuantity: { decrement: qty }
          },
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          userId: session.userId,
          componentId,
          action,
          quantity: qty,
        },
        include: { component: true },
      });

      return transaction;
    });

    return NextResponse.json({ transaction: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
