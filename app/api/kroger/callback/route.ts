// app/api/kroger/callback/route.ts
import {
  getCookie,
  getUserToken,
  setCookie,
} from "@/lib/kroger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const krogerCookie = await getCookie("kroger_state");
  if (url.searchParams.get("state") !== krogerCookie)
    return new NextResponse("State mismatch", { status: 400 });

  const code = url.searchParams.get("code")!;
  const verifier = (await getCookie("kroger_pkce_verifier"))!;
  
  try {
    const userToken = await getUserToken(code, verifier);
    
    // Store the user token for later use
    await setCookie("kroger_user_token", userToken);
    
    // Redirect back to the suggestions page with success
    return NextResponse.redirect(new URL('/suggestions?kroger_auth=success', req.url));
  } catch (error) {
    console.error('Error getting user token:', error);
    return NextResponse.redirect(new URL('/suggestions?kroger_auth=error', req.url));
  }
}