import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "./db/db";
import User from "./db/models/user.model";

const findOrCreateOAuthUser = async ({
  email,
  image,
  name,
}: {
  email: string;
  image: string;
  name?: string;
}) => {
  await connectDB();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return existingUser;
  }
  const newUser = await User.create({
    name: name || email.split("@")[0],
    email,
    image,
  });
  return newUser;
};

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user || !user.email || !user.image || !user.name) {
        throw new Error("Email is required");
      }
      try {
        const userData = await findOrCreateOAuthUser({
          email: user.email,
          image: user.image,
          name: user?.name,
        });

        user.id = userData._id.toString();
        return true;
      } catch (error) {
        console.error("OAuth sign in error:", error);
        throw new Error("Failed to sign in with OAuth. Please try again.");
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user && trigger !== "update") {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
  pages: {
    signIn: "/auth",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
