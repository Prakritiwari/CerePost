import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    const service =
        req.nextUrl.searchParams.get("service") === "Office365"
            ? "Office365"
            : "Google";

    try {
        const url = await getAurinkoAuthorizationUrl(service);
        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Could not start Aurinko authorization:", error);
        return NextResponse.redirect(new URL("/mail?link=failed", req.url));
    }
}
