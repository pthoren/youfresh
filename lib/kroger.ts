// lib/kroger.ts
import crypto from "crypto";
import { cookies } from "next/headers";

/* ---------- PKCE helpers ---------- */
export function buildPkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export async function setCookie(name: string, value: string, maxAge: number = 600) {
  const cookieStore = await cookies();
  const cookieOptions = { 
    httpOnly: true, 
    path: "/", 
    maxAge,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
  
  try {
    return cookieStore.set(name, value, cookieOptions);
  } catch (error) {
    console.error(`Failed to set cookie ${name}:`, error);
    throw error;
  }
}

export async function getCookie(name: string) {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Failed to get cookie ${name}:`, error);
    return undefined;
  }
}

/* ---------- Kroger token helpers ---------- */
export async function getAppToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "product.compact",
  });
  const res = await fetch(
    "https://api.kroger.com/v1/connect/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token; // ~30 min
}

export async function getUserToken(code: string, verifier: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${process.env.KROGER_REDIRECT_URI}/api/kroger/callback`,
    code_verifier: verifier,
  });
  const res = await fetch(
    "https://api.kroger.com/v1/connect/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

/* ---------- Catalog / cart helpers ---------- */
export async function getLocationId(zip: string, appToken: string) {
  const res = await fetch(
    `https://api.kroger.com/v1/locations?filter.zipCode.near=${zip}&filter.limit=1`,
    { headers: { Authorization: `Bearer ${appToken}` }, cache: "no-store" }
  );
  const json = await res.json();
  return json.data[0].locationId as string;
}

export async function searchUpc(
  term: string,
  loc: string,
  appToken: string
) {
  const res = await fetch(
    `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(
      term
    )}&filter.locationId=${loc}&filter.limit=1`,
    { headers: { Authorization: `Bearer ${appToken}` }, cache: "no-store" }
  );
  const json = await res.json();
  return json.data?.[0]?.upc as string | undefined;
}

export async function addToCart(upcs: string[], userToken: string) {
  const body = JSON.stringify({
    items: upcs.map((u) => ({ upc: u, quantity: 1 })),
    allowSubstitutes: true,
  });
  await fetch("https://api.kroger.com/v1/cart/add", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  }); // 204 = success :contentReference[oaicite:3]{index=3}
}
