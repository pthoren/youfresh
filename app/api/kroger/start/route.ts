// app/api/kroger/start/route.ts
import { buildPkce } from "@/lib/kroger";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const { verifier, challenge } = buildPkce();
  const state = randomBytes(12).toString("hex");

  const authUrl = new URL("https://api.kroger.com/v1/connect/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", process.env.KROGER_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.KROGER_REDIRECT_URI}/api/kroger/callback`
  );
  authUrl.searchParams.set("scope", "product.compact cart.basic:write");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  /* --- create redirect response and attach cookies to *that* object --- */
  const res = NextResponse.redirect(authUrl);
  res.cookies.set({
    name: "kroger_pkce_verifier",
    value: verifier,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,          // 10 min
  });
  res.cookies.set({
    name: "kroger_state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}