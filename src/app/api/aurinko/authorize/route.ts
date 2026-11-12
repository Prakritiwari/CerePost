import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getAurinkoAuthorizationUrl, checkAurinkoCredentials } from "@/lib/aurinko";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    const service =
        req.nextUrl.searchParams.get("service") === "Office365"
            ? "Office365"
            : "Google";

    const fail = (reason: string) =>
        NextResponse.redirect(
            new URL(
                `/mail?link=failed&reason=${encodeURIComponent(reason)}`,
                req.url,
            ),
        );

    try {
        const credentials = await checkAurinkoCredentials();
        if (!credentials.ok) {
            console.error("Aurinko credentials check failed:", credentials.code);
            return fail(credentials.code ?? "configuration");
        }

        const url = await getAurinkoAuthorizationUrl(service);

        // Probe the authorize endpoint before sending the browser there, so a
        // bad client ID/app shows our error UI instead of raw Aurinko JSON.
        const probe = await fetch(url, {
            redirect: "manual",
            cache: "no-store",
        });

        if (probe.status >= 400 || (probe.status >= 200 && probe.status < 300)) {
            const data = (await probe.json().catch(() => null)) as
                | { code?: string; message?: string }
                | null;
            console.error("Aurinko authorization rejected:", {
                status: probe.status,
                code: data?.code,
                message: data?.message,
            });
            return fail(data?.code ?? "authorize_failed");
        }

        if (!probe.headers.get("location")) {
            return fail("authorize_failed");
        }

        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Could not start Aurinko authorization:", {
            message: (error as Error).message,
            hasClientId: Boolean(process.env.AURINKO_CLIENT_ID?.trim()),
            hasClientSecret: Boolean(process.env.AURINKO_CLIENT_SECRET?.trim()),
            hasPublicUrl: Boolean(process.env.NEXT_PUBLIC_URL?.trim()),
        });
        const reason = /not configured/i.test((error as Error).message)
            ? "configuration"
            : "authorize_failed";
        return fail(reason);
    }
}
