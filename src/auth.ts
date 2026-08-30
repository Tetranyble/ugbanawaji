import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { authAccounts, authSessions, authVerifications, users } from "@/db/schema";
import { env } from "@/lib/env";

const trustedOrigins = Array.from(
  new Set(
    [env.appUrl, process.env.NEXT_PUBLIC_SITE_URL]
      .filter((value): value is string => Boolean(value))
      .map((value) => new URL(value).origin),
  ),
);

export const authServer = betterAuth({
  appName: env.appName,
  baseURL: process.env.BETTER_AUTH_URL || env.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: users,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    password: {
      hash: async (password) => hash(password, Math.min(15, Math.max(10, env.bcryptRounds))),
      verify: async ({ hash: passwordHash, password }) => compare(password, passwordHash),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "ADMIN",
        input: false,
      },
      themePreference: {
        type: "string",
        required: true,
        defaultValue: "SYSTEM",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 8,
    disableSessionRefresh: true,
  },
  plugins: [nextCookies()],
});

export default authServer;

export async function auth() {
  return authServer.api.getSession({ headers: await headers() });
}

export async function signOut({ redirectTo }: { redirectTo?: string } = {}) {
  await authServer.api.signOut({ headers: await headers() });
  if (redirectTo) redirect(redirectTo);
}

export type AuthSession = typeof authServer.$Infer.Session;
