import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO = {
  name: 'Demo User',
  email: 'demo@teamflow.dev',
  password: 'demo1234',
};

const labelData = [
  { name: 'Work', color: '#3b82f6' },
  { name: 'Personal', color: '#10b981' },
  { name: 'Urgent', color: '#ef4444' },
  { name: 'Ideas', color: '#f59e0b' },
];

const listData = [
  { name: 'Inbox', tasks: ['Welcome to Teamflow ✨', 'Set up your first project'] },
  { name: 'This Week', tasks: ['Deploy app to Vercel 🚀', 'Review pull requests'] },
  { name: 'Later', tasks: ['Refactor task service', 'Write documentation'] },
];

const subtaskData = [
  ['Create a new task', 'Assign a label', 'Add an optional due date'],
  ['Connect a PostgreSQL database to Neon', 'Add DATABASE_URL to Vercel env vars', 'Run the production build'],
];

async function main() {
  console.log('🌱 Seeding database...');

  const existing = await prisma.user.findUnique({
    where: { email: DEMO.email },
  });

  if (existing) {
    console.log('Demo user already exists. Skipping.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: DEMO.name,
      email: DEMO.email,
      password: await bcrypt.hash(DEMO.password, 10),
    },
  });

  const labels = [];
  for (const label of labelData) {
    labels.push(
      await prisma.label.create({
        data: { userId: user.id, name: label.name, color: label.color },
      }),
    );
  }

  let order = 0;
  for (let i = 0; i < listData.length; i += 1) {
    const list = await prisma.list.create({
      data: { userId: user.id, name: listData[i].name, order: order + 1 },
    });
    order += 1;

    for (let t = 0; t < listData[i].tasks.length; t += 1) {
      const task = await prisma.task.create({
        data: {
          userId: user.id,
          listId: list.id,
          name: listData[i].tasks[t],
          order: t + 1,
          priority: labels[t % labels.length] ? 'MEDIUM' : 'LOW',
        },
      });

      if (i < subtaskData.length) {
        let subOrder = 0;
        for (const sub of subtaskData[i] || []) {
          subOrder += 1;
          await prisma.subtask.create({
            data: {
              taskId: task.id,
              userId: user.id,
              name: sub,
              order: subOrder,
            },
          });
        }
      }
    }
  }

  console.log('✅ Seeding complete.');
  console.log(`   Login with: ${DEMO.email} / ${DEMO.password}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });