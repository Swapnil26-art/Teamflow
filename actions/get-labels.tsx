import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const getLabels = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const labels = await db.label.findMany({
    where: { userId: session.user?.id },
  });

  return labels;
};
