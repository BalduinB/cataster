import type { Auth } from "convex/server";

export async function getUserId({ auth }: { auth: Auth }) {
  return (await auth.getUserIdentity())?.subject ?? null;
}

export async function requireUserId({ auth }: { auth: Auth }) {
  const userId = await getUserId({ auth });
  if (userId) return userId;

  throw new Error(
    "Authenticated user was required, but no Clerk subject was found",
  );
}
