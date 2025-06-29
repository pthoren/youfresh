// app/api/kroger/debug/route.ts
import { getCookie } from "@/lib/kroger";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const requestCookies = req.cookies.getAll();
    
    const userToken = await getCookie("kroger_user_token");
    const userTokenFromRequest = req.cookies.get("kroger_user_token")?.value;
    const state = await getCookie("kroger_state");
    const verifier = await getCookie("kroger_pkce_verifier");
    const groceryList = await getCookie("grocery_list");
    
    return NextResponse.json({
      userTokenFromCookieStore: !!userToken,
      userTokenFromRequest: !!userTokenFromRequest,
      state: !!state,
      verifier: !!verifier,
      groceryList: !!groceryList,
      cookieStoreCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      requestCookies: requestCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      environment: process.env.NODE_ENV,
      domain: req.headers.get('host'),
      userAgent: req.headers.get('user-agent')
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
