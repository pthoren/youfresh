// app/api/kroger/debug/route.ts
import { getCookie } from "@/lib/kroger";
import { getUserToken as getStoredUserToken, generateSessionId } from "@/lib/tokenStore";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const requestCookies = req.cookies.getAll();
    
    // Generate session ID
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sessionId = generateSessionId(userAgent, ip);
    
    // Check token store
    const userTokenFromStore = await getStoredUserToken(sessionId);
    
    // Check cookies
    const cookieSessionId = req.cookies.get("kroger_session_id")?.value;
    const userTokenFromCookieSession = cookieSessionId ? await getStoredUserToken(cookieSessionId) : null;
    
    const state = await getCookie("kroger_state");
    const verifier = await getCookie("kroger_pkce_verifier");
    const groceryList = await getCookie("grocery_list");
    
    return NextResponse.json({
      sessionId,
      cookieSessionId,
      userTokenFromStore: !!userTokenFromStore,
      userTokenFromCookieSession: !!userTokenFromCookieSession,
      state: !!state,
      verifier: !!verifier,
      groceryList: !!groceryList,
      cookieStoreCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      requestCookies: requestCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      environment: process.env.NODE_ENV,
      domain: req.headers.get('host'),
      userAgent: req.headers.get('user-agent'),
      ip
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
