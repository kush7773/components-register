import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db'
});

async function seed() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  let admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    await prisma.user.create({
      data: { username: 'admin', password: adminPassword, role: 'ADMIN' },
    });
  }

  let emp = await prisma.user.findUnique({ where: { username: 'employee' } });
  if (!emp) {
    await prisma.user.create({
      data: { username: 'employee', password: employeePassword, role: 'EMPLOYEE' },
    });
  }

  console.log('Seeded database with admin and employee users.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
