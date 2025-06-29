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
    
    console.log('Successfully obtained Kroger user token');
    console.log('Cookie domain:', req.headers.get('host'));
    console.log('Environment:', process.env.NODE_ENV);
    
    // Create response with redirect
    const redirectUrl = new URL('/suggestions?kroger_auth=success', req.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // Set the cookie directly on the response object
    response.cookies.set({
      name: "kroger_user_token",
      value: userToken,
      httpOnly: true,
      path: "/",
      maxAge: 1800, // 30 minutes
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    console.log('Cookie set on response');
    
    return response;
  } catch (error) {
    console.error('Error getting user token:', error);
    return NextResponse.redirect(new URL('/suggestions?kroger_auth=error', req.url));
  }
}