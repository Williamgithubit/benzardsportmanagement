import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export const requireAuth = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  return session;
};

export const requireAdmin = async () => {
  const session = await requireAuth();
  
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  
  return session;
};
