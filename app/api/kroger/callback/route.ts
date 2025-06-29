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
    
    // Store the user token for later use with longer expiration (30 minutes)
    await setCookie("kroger_user_token", userToken, 1800);
    
    console.log('Successfully stored Kroger user token');
    console.log('Cookie domain:', req.headers.get('host'));
    
    // Create response with redirect
    const redirectUrl = new URL('/suggestions?kroger_auth=success', req.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // Also set the cookie directly on the response as a backup
    response.cookies.set({
      name: "kroger_user_token",
      value: userToken,
      httpOnly: true,
      path: "/",
      maxAge: 1800,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    return response;
  } catch (error) {
    console.error('Error getting user token:', error);
    return NextResponse.redirect(new URL('/suggestions?kroger_auth=error', req.url));
  }
}