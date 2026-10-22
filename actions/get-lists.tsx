import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const getLists = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const lists = await db.list.findMany({
    where: { userId: session.user?.id },
  });

  return lists;
};
