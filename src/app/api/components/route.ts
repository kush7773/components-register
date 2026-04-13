import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const components = await prisma.component.findMany();
    return NextResponse.json({ components });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, totalQuantity } = await req.json();

    const newComponent = await prisma.component.create({
      data: {
        name,
        description,
        totalQuantity: parseInt(totalQuantity),
        availableQuantity: parseInt(totalQuantity),
      },
    });

    return NextResponse.json({ component: newComponent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create component' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, name, description, totalQuantity } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Component ID is required' }, { status: 400 });
    }

    const existing = await prisma.component.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const newTotal = parseInt(totalQuantity);
    if (isNaN(newTotal) || newTotal < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Calculate the difference and adjust available quantity proportionally
    const diff = newTotal - existing.totalQuantity;
    const newAvailable = Math.max(0, existing.availableQuantity + diff);

    const updated = await prisma.component.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
      },
    });

    return NextResponse.json({ component: updated });
  } catch (error) {
    console.error('Update component error:', error);
    return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
  }
}
