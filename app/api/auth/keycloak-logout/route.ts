import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const appUrl = process.env.NEXTAUTH_URL;

  if (!issuer || !clientId || !appUrl || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: "Keycloak logout requires issuer, client, app URL, and NEXTAUTH_SECRET configuration." },
      { status: 503 },
    );
  }

  let token;
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  if (typeof token?.keycloakIdToken !== "string") {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  const logoutUrl = new URL(`${issuer.replace(/\/+$/, "")}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set("id_token_hint", token.keycloakIdToken);
  logoutUrl.searchParams.set("post_logout_redirect_uri", new URL("/auth/complete-logout", appUrl).toString());

  return NextResponse.redirect(logoutUrl);
}