import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { recordKeycloakSignIn, recordLocalSignOut } from "@/lib/auth-data";

const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
      clientSecret,
      issuer: process.env.KEYCLOAK_ISSUER ?? "",
      client: {
        token_endpoint_auth_method: clientSecret ? "client_secret_post" : "none",
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  events: {
    async signIn({ account, user }) {
      if (account?.provider !== "keycloak") {
        return;
      }

      await recordKeycloakSignIn({
        subject: account.providerAccountId,
        email: user.email ?? null,
        displayName: user.name ?? null,
      });
    },
    async signOut({ token }) {
      if (token.sub) {
        await recordLocalSignOut(token.sub);
      }
    },
  },
};