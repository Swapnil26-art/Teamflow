import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isNextDynamicError } from '@/lib/util/next-error';

export const getLabels = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return await db.label.findMany({
      where: { userId: session.user.id },
    });
  } catch (error) {
    if (isNextDynamicError(error)) throw error;

    console.error('[GET_LABELS]', error);
    return null;
  }
};
