// app/api/kroger/callback/route.ts
import {
  getCookie,
  getUserToken,
  getAppToken,
  getLocationId,
  searchUpc,
  addToCart,
} from "@/lib/kroger";
import { NextRequest, NextResponse } from "next/server";

const LIST = [
  "1 head broccoli",
  "1 cup cheese",
  "1 lb ground beef",
  "1 lb impossible meat",
  "1 box lasagna noodles",
  "1 onion",
  "1 box pasta",
  "1 cup rice",
  "1 package spinach",
  "2 can strained tomatoes",
  "1 block tofu",
];

function normalize(line: string) {
  return line.replace(/^\d+\s+\w+\s+/i, "").trim();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const krogerCookie = await getCookie("kroger_state");
  if (url.searchParams.get("state") !== krogerCookie)
    return new NextResponse("State mismatch", { status: 400 });

  const code = url.searchParams.get("code")!;
  const verifier = (await getCookie("kroger_pkce_verifier"))!;
  const userToken = await getUserToken(code, verifier);

  const appToken = await getAppToken();
  const locId = await getLocationId(process.env.ZIP!, appToken);

  const upcPromises = LIST.map(line => searchUpc(normalize(line), locId, appToken));
  const upcResults = await Promise.all(upcPromises);
  const upcs = upcResults.filter(upc => upc !== null && upc !== undefined);

  if (upcs.length > 0) {
    await addToCart(upcs, userToken);
      return new NextResponse(
    "🎉  Items are waiting in your Kroger cart. Open the Kroger app or kroger.com to check out!"
  );
  } else {
    return new NextResponse("Unable to find items to add to cart");
  }

}