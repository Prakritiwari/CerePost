import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
        context?: string;
        prompt?: string;
    } | null;

    const rawPrompt = body?.prompt?.trim();
    const prompt =
        rawPrompt && rawPrompt.length > 0
            ? rawPrompt
            : "Write a thoughtful email.";
    const context = body?.context?.trim() ?? "";

    const result = streamText({
        model: google("gemini-3.5-flash"),
        prompt: `
            You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by providing thoughtful, natural, and accurate responses based on the context of their previous emails.

            THE TIME NOW IS ${new Date().toLocaleString()}

            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            USER INSTRUCTIONS / INTENT:
            ${prompt}

            When responding:
            - Write directly in natural, human email prose.
            - Greet the recipient by their first name if known from the previous email.
            - Directly address any questions, requests, or information from the latest email in the context.
            - Sign off naturally with the sender's name provided in context.
            - Never include meta commentary like "Here is your email draft:" or subject lines.
            - Never wrap the output in markdown code blocks like \`\`\`email. Output only the message body.
        `,
    });

    return result.toTextStreamResponse();
}
