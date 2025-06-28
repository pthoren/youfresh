import { getServerSession } from 'next-auth';
import db from '@/lib/db';

export async function getCurrentUser() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await db('users').where({ email: session.user.email }).first();
  return user;
}
