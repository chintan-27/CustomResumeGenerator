import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    accessToken: string;
  }

  interface JWT {
    id?: string;
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    accessToken: string;
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FLASK_BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5328";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    // Google Authentication
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      checks: ["none"],
    }),

    // Email & Password Authentication
    CredentialsProvider({
      id: "email-password",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${FLASK_BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });
      
          const data = await response.json();
          if (!response.ok) {
            console.warn("Login failed:", data.error || "Invalid email or password");
            return null;
          }
      
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.access_token,
          };
        } catch (error) {
          console.error("Error during email-password authentication:", error);
          throw new Error("Login failed. Please try again.");
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile, credentials }) {
      if (account?.provider === "google") {
        if (!profile?.email) {
          throw new Error("No profile");
        }
        try {
          const backendResponse = await fetch(`${FLASK_BACKEND_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: profile.name,
              email: profile.email,
            }),
          });

          const data = await backendResponse.json();
          if (!backendResponse.ok) {
            throw new Error(data.error || "Google Authentication failed");
          }

          console.log("Received token from Flask:", data.access_token);
          return true;
        } catch (error) {
          console.error("Flask API error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, profile, account }) {
      if (user) {
        // Store JWT token if logging in via email-password
        token.id = user.id;
        token.accessToken = user.accessToken;
      }

      if (account?.provider === "google" && profile) {
        try {
          const backendResponse = await fetch(`${FLASK_BACKEND_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: profile.name,
              email: profile.email,
            }),
          });

          const data = await backendResponse.json();
          if (backendResponse.ok) {
            token.id = data.user.id;
            token.accessToken = data.access_token;
          }
        } catch (error) {
          console.error("Failed to fetch user data from Flask backend:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
