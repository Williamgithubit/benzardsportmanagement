import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { compare } from 'bcryptjs';
import { User } from 'next-auth';

// Type definitions are now in src/types/next-auth.d.ts

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password || !(await compare(credentials.password, user.password))) {
          throw new Error('Invalid email or password');
        }

        // Return user object that matches our User type
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image ?? null,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add the required properties to session.user
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
};

// Export the auth handler
export default authOptions;
