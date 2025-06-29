// app/api/kroger/add-to-cart/route.ts
import {
  getAppToken,
  getLocationId,
  searchUpc,
  addToCart,
} from "@/lib/kroger";
import { getUserToken as getStoredUserToken, generateSessionId } from "@/lib/tokenStore";
import { NextRequest, NextResponse } from "next/server";

function normalize(line: string) {
  return line.replace(/^\d+\s+\w+\s+/i, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    // Generate session ID from request info
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sessionId = generateSessionId(userAgent, ip);
    
    // Try to get session ID from cookie as backup
    const cookieSessionId = req.cookies.get("kroger_session_id")?.value;
    const finalSessionId = cookieSessionId || sessionId;
    
    // Get user token from database-backed token store
    const userToken = await getStoredUserToken(finalSessionId);
    
    console.log('Session ID:', finalSessionId);
    console.log('Kroger user token found:', !!userToken);
    
    if (!userToken) {
      console.log('No Kroger user token found in database');
      return NextResponse.json(
        { error: "Not authenticated with Kroger" },
        { status: 401 }
      );
    }

    // Get grocery list from request body
    const { groceryList } = await req.json();
    if (!groceryList || !Array.isArray(groceryList)) {
      return NextResponse.json(
        { error: "Invalid grocery list provided" },
        { status: 400 }
      );
    }

    // Get app token and location
    const appToken = await getAppToken();
    const locId = await getLocationId(process.env.ZIP!, appToken);

    // Convert ingredient objects to search strings
    const searchStrings = groceryList.map((item: {name: string, quantity: string, unit: string}) => 
      `${item.quantity} ${item.unit} ${item.name}`
    );

    // Search for UPCs for each ingredient
    const upcPromises = searchStrings.map((searchString: string) => 
      searchUpc(normalize(searchString), locId, appToken)
    );
    const upcResults = await Promise.all(upcPromises);
    const validUpcs = upcResults.filter((upc: string | undefined) => upc !== null && upc !== undefined);

    if (validUpcs.length === 0) {
      return NextResponse.json(
        { error: "No items could be found in Kroger's catalog" },
        { status: 404 }
      );
    }

    // Add items to cart
    await addToCart(validUpcs, userToken);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${validUpcs.length} out of ${groceryList.length} items to your Kroger cart`,
      itemsAdded: validUpcs.length,
      totalItems: groceryList.length
    });

  } catch (error) {
    console.error('Error adding items to Kroger cart:', error);
    return NextResponse.json(
      { error: "Failed to add items to cart" },
      { status: 500 }
    );
  }
}
