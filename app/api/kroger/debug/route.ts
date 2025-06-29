// app/api/kroger/debug/route.ts
import { getCookie } from "@/lib/kroger";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    const userToken = await getCookie("kroger_user_token");
    const state = await getCookie("kroger_state");
    const verifier = await getCookie("kroger_pkce_verifier");
    const groceryList = await getCookie("grocery_list");
    
    return NextResponse.json({
      userToken: !!userToken,
      state: !!state,
      verifier: !!verifier,
      groceryList: !!groceryList,
      allCookieNames: allCookies.map(c => c.name),
      environment: process.env.NODE_ENV,
      domain: req.headers.get('host')
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
