// app/api/kroger/callback/route.ts
import {
  getCookie,
  getUserToken,
} from "@/lib/kroger";
import { storeUserToken, generateSessionId } from "@/lib/tokenStore";
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
    
    // Generate a session ID from request info
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sessionId = generateSessionId(userAgent, ip);
    
    // Store the token in our database-backed token store
    await storeUserToken(sessionId, userToken);
    
    console.log('Successfully stored Kroger user token with session ID:', sessionId);
    
    // Create response with redirect and store session ID in cookie
    const redirectUrl = new URL('/suggestions?kroger_auth=success', req.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // Store session ID in a cookie so we can retrieve the token later
    response.cookies.set({
      name: "kroger_session_id",
      value: sessionId,
      httpOnly: true,
      path: "/",
      maxAge: 1800, // 30 minutes
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    return response;
  } catch (error) {
    console.error('Error getting user token:', error);
    return NextResponse.redirect(new URL('/suggestions?kroger_auth=error', req.url));
  }
}