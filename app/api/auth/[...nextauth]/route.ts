import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import db from '@/lib/db';
import { User } from '@/lib/types';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          const existingUser = await db('users')
            .where({ provider: 'google', provider_id: account.providerAccountId })
            .first();

          if (!existingUser) {
            // Create new user
            await db('users').insert({
              email: profile.email,
              name: profile.name || user.name || '',
              image: (profile as any).picture || user.image,
              provider: 'google',
              provider_id: account.providerAccountId,
            });
          }
          return true;
        } catch (error) {
          console.error('Error creating user:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        // Get user from database
        const dbUser = await db('users')
          .where({ email: session.user.email })
          .first();
        
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google') {
        token.providerId = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
