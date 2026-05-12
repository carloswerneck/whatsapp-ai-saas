import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        (session.user as any).accountId = token.accountId as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { accountId: true, role: true },
        });
        token.accountId = dbUser?.accountId;
        token.role = dbUser?.role;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          const newAccount = await prisma.account.create({
            data: {
              name: user.name || "My Organization",
              slug:
                user.email!.split("@")[0].replace(/[^a-z0-9]/g, "") +
                "-" +
                Date.now().toString(36),
              plan: "FREE",
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          });
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "User",
              role: "OWNER",
              accountId: newAccount.id,
            },
          });
        }
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
});