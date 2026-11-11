import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
        input?: string;
    } | null;
    const input = body?.input?.trim();

    if (!input) {
        return Response.json(
            { error: "Write a few words first." },
            { status: 400 },
        );
    }

    const result = streamText({
        model: google("gemini-3.5-flash"),
        prompt: `
            ALWAYS RESPOND IN PLAIN TEXT, no html or markdown.

            You are a helpful AI embedded in an email client app that is used to autocomplete sentences, similar to Google Gmail autocomplete.

            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            AI is a well-behaved and well-mannered individual.
            AI is always friendly, kind, and inspiring.

            I am writing a piece of text in a notion text editor app.
            Help me complete my train of thought here: <input>${input}</input>

            Keep the tone of the text consistent with the rest of the text.
            Keep the response short and sweet.
            Act like a copilot, finish my sentence if need be, but don't try to generate a whole new paragraph.
            Do not add fluff like "I'm here to help you" or "I'm a helpful AI".

            Example:
            Dear Alice, I'm sorry to hear that you are feeling down.

            Output: Unfortunately, I can't help you with that.

            Your output is directly concatenated to the input, so do not add any new lines or formatting, just plain text.
        `,
    });

    return result.toTextStreamResponse();
}
